"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/session";
import {
  lockBatch,
  processBatch,
  publishBatch,
  resetInterruptedBatch,
  rerunFailedBatch,
} from "@/lib/matching/batch-runner";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.generated";

const batchDraftSchema = z
  .object({
    questionnaireVersionId: z.string().uuid("请选择已发布问卷版本"),
    signupEndAt: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "请填写有效的报名截止时间")
      .transform((value) => new Date(value).toISOString()),
    matchRunAt: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "请填写有效的匹配计算时间")
      .transform((value) => new Date(value).toISOString()),
    resultPublishAt: z
      .string()
      .trim()
      .refine((value) => !Number.isNaN(new Date(value).getTime()), "请填写有效的结果发布时间")
      .transform((value) => new Date(value).toISOString()),
    notes: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const signupEndAt = new Date(value.signupEndAt);
    const matchRunAt = new Date(value.matchRunAt);
    const resultPublishAt = new Date(value.resultPublishAt);

    if (!(signupEndAt < matchRunAt && matchRunAt < resultPublishAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "必须满足 signup_end_at < match_run_at < result_publish_at",
        path: ["signupEndAt"],
      });
    }
  });

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function redirectWithMessage(
  pathname: string,
  params: Record<string, string | null>,
): never {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      searchParams.set(key, value);
    }
  });

  redirect(
    searchParams.size > 0 ? `${pathname}?${searchParams.toString()}` : pathname,
  );
}

async function logBatchOperation(input: {
  actionType: string;
  actorUserId: string;
  batchId: string;
  payloadJson?: Json;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("operation_logs").insert({
    actor_role: "admin",
    actor_user_id: input.actorUserId,
    action_type: input.actionType,
    entity_type: "match_batch",
    entity_id: input.batchId,
    payload_json: input.payloadJson ?? null,
  });

  if (error) {
    throw error;
  }
}

async function ensureNoCurrentBatch() {
  const admin = createAdminSupabaseClient();
  const { count, error } = await admin
    .from("match_batches")
    .select("id", { count: "exact", head: true })
    .in("status", ["draft", "open", "locked", "processing", "failed"]);

  if (error) {
    throw error;
  }

  if ((count ?? 0) > 0) {
    throw new Error("当前已有未完成批次，不能再新建批次。");
  }
}

async function getPublishedQuestionnaireSnapshot(questionnaireVersionId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("questionnaire_versions")
    .select("id, status, matching_policy_json")
    .eq("id", questionnaireVersionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.status !== "published") {
    throw new Error("只能绑定已发布问卷版本。");
  }

  return data;
}

async function getNextRoundNo() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("match_batches")
    .select("round_no")
    .order("round_no", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data?.round_no ?? 0) + 1;
}

export async function createBatchAction(formData: FormData) {
  const actor = await requireAdminUser();
  const payload = await (async () => {
    try {
      const parsed = batchDraftSchema.parse({
        questionnaireVersionId: stringField(formData, "questionnaireVersionId"),
        signupEndAt: stringField(formData, "signupEndAt"),
        matchRunAt: stringField(formData, "matchRunAt"),
        resultPublishAt: stringField(formData, "resultPublishAt"),
        notes: stringField(formData, "notes"),
      });

      await ensureNoCurrentBatch();
      return parsed;
    } catch (error) {
      return redirectWithMessage("/admin/batches", {
        error: error instanceof Error ? error.message : "批次创建失败。",
      });
    }
  })();

  const [questionnaireVersion, nextRoundNo] = await Promise.all([
    getPublishedQuestionnaireSnapshot(payload.questionnaireVersionId),
    getNextRoundNo(),
  ]);

  const admin = createAdminSupabaseClient();
  const code = `round-${String(nextRoundNo).padStart(4, "0")}`;
  const label = `第 ${nextRoundNo} 轮`;
  const signupStartAt = new Date().toISOString();

  if (!(new Date(signupStartAt) < new Date(payload.signupEndAt))) {
    redirectWithMessage("/admin/batches", {
      error: "创建时的 signup_start_at 必须早于 signup_end_at。",
    });
  }

  const { data: createdBatch, error } = await admin
    .from("match_batches")
    .insert({
      code,
      label,
      questionnaire_version_id: questionnaireVersion.id,
      signup_start_at: signupStartAt,
      signup_end_at: payload.signupEndAt,
      match_run_at: payload.matchRunAt,
      result_publish_at: payload.resultPublishAt,
      status: "draft",
      notes: payload.notes ? payload.notes : null,
      round_no: nextRoundNo,
      matching_policy_snapshot_json: questionnaireVersion.matching_policy_json,
      published_at: null,
      processed_at: null,
      last_error_message: null,
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  await logBatchOperation({
    actionType: "batch_created",
    actorUserId: actor.id,
    batchId: createdBatch.id,
    payloadJson: {
      round_no: nextRoundNo,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/batches");
  redirect(`/admin/batches/${createdBatch.id}`);
}

export async function updateBatchAction(formData: FormData) {
  const actor = await requireAdminUser();
  const batchId = stringField(formData, "batchId");

  if (!batchId) {
    redirectWithMessage("/admin/batches", {
      error: "缺少待编辑的批次。",
    });
  }

  const payload = (() => {
    try {
      return batchDraftSchema.parse({
        questionnaireVersionId: stringField(formData, "questionnaireVersionId"),
        signupEndAt: stringField(formData, "signupEndAt"),
        matchRunAt: stringField(formData, "matchRunAt"),
        resultPublishAt: stringField(formData, "resultPublishAt"),
        notes: stringField(formData, "notes"),
      });
    } catch (error) {
      return redirectWithMessage(`/admin/batches/${batchId}`, {
        error: error instanceof Error ? error.message : "批次更新失败。",
      });
    }
  })();

  const admin = createAdminSupabaseClient();
  const { data: currentBatch, error: currentBatchError } = await admin
    .from("match_batches")
    .select("status, signup_start_at")
    .eq("id", batchId)
    .maybeSingle();

  if (currentBatchError) {
    throw currentBatchError;
  }

  if (!currentBatch || currentBatch.status !== "draft") {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "只有 draft 批次可以编辑。",
    });
  }

  if (!(new Date(currentBatch.signup_start_at) < new Date(payload.signupEndAt))) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "signup_start_at 必须早于 signup_end_at。",
    });
  }

  const questionnaireVersion = await getPublishedQuestionnaireSnapshot(
    payload.questionnaireVersionId,
  );

  const { error } = await admin
    .from("match_batches")
    .update({
      questionnaire_version_id: questionnaireVersion.id,
      signup_end_at: payload.signupEndAt,
      match_run_at: payload.matchRunAt,
      result_publish_at: payload.resultPublishAt,
      notes: payload.notes ? payload.notes : null,
      matching_policy_snapshot_json: questionnaireVersion.matching_policy_json,
      last_error_message: null,
    })
    .eq("id", batchId)
    .eq("status", "draft");

  if (error) {
    throw error;
  }

  await logBatchOperation({
    actionType: "batch_updated",
    actorUserId: actor.id,
    batchId,
  });

  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  redirect(`/admin/batches/${batchId}`);
}

export async function openBatchSignupAction(formData: FormData) {
  const actor = await requireAdminUser();
  const batchId = stringField(formData, "batchId");
  const admin = createAdminSupabaseClient();

  if (!batchId) {
    redirectWithMessage("/admin/batches", {
      error: "缺少待开放的批次。",
    });
  }

  const { data: batch, error: batchError } = await admin
    .from("match_batches")
    .select("signup_end_at, status")
    .eq("id", batchId)
    .maybeSingle();

  if (batchError) {
    throw batchError;
  }

  if (!batch || batch.status !== "draft") {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "只有 draft 批次可以开放报名。",
    });
  }

  const nowIso = new Date().toISOString();

  if (!(new Date(nowIso) < new Date(batch.signup_end_at))) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "当前时间已经晚于报名截止时间，不能再开放报名。",
    });
  }

  const { error } = await admin
    .from("match_batches")
    .update({
      status: "open",
      signup_start_at: nowIso,
      last_error_message: null,
    })
    .eq("id", batchId)
    .eq("status", "draft");

  if (error) {
    throw error;
  }

  await logBatchOperation({
    actionType: "batch_opened",
    actorUserId: actor.id,
    batchId,
  });

  revalidatePath("/admin");
  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  redirect(`/admin/batches/${batchId}`);
}

export async function lockBatchAction(formData: FormData) {
  const batchId = stringField(formData, "batchId");

  if (!batchId) {
    redirectWithMessage("/admin/batches", {
      error: "缺少待锁定的批次。",
    });
  }

  await requireAdminUser();
  await lockBatch(batchId);
  revalidatePath("/admin");
  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  redirect(`/admin/batches/${batchId}`);
}

export async function runBatchNowAction(formData: FormData) {
  const batchId = stringField(formData, "batchId");
  const admin = createAdminSupabaseClient();

  if (!batchId) {
    redirectWithMessage("/admin/batches", {
      error: "缺少待执行的批次。",
    });
  }

  await requireAdminUser();

  const { data: batch, error: batchError } = await admin
    .from("match_batches")
    .select("status")
    .eq("id", batchId)
    .maybeSingle();

  if (batchError) {
    throw batchError;
  }

  if (!batch || (batch.status !== "locked" && batch.status !== "failed")) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "只有 locked 或 failed 批次可以立即执行匹配。",
    });
  }

  const didProcess =
    batch.status === "failed"
      ? await rerunFailedBatch(batchId)
      : await processBatch(batchId);

  if (!didProcess) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "该批次已在处理或状态已变化，请刷新后重试。",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  redirect(`/admin/batches/${batchId}`);
}

export async function publishBatchNowAction(formData: FormData) {
  const batchId = stringField(formData, "batchId");
  const admin = createAdminSupabaseClient();

  if (!batchId) {
    redirectWithMessage("/admin/batches", {
      error: "缺少待发布的批次。",
    });
  }

  await requireAdminUser();

  const { data: batch, error: batchError } = await admin
    .from("match_batches")
    .select("status, processed_at")
    .eq("id", batchId)
    .maybeSingle();

  if (batchError) {
    throw batchError;
  }

  if (!batch || batch.status !== "processing" || !batch.processed_at) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "只有已完成计算的 processing 批次可以立即发布结果。",
    });
  }

  await publishBatch(batchId);
  revalidatePath("/admin");
  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  redirect(`/admin/batches/${batchId}`);
}

export async function resetInterruptedBatchAction(formData: FormData) {
  const batchId = stringField(formData, "batchId");
  const admin = createAdminSupabaseClient();

  if (!batchId) {
    redirectWithMessage("/admin/batches", {
      error: "缺少待重置的批次。",
    });
  }

  await requireAdminUser();

  const { data: batch, error: batchError } = await admin
    .from("match_batches")
    .select("status, processed_at")
    .eq("id", batchId)
    .maybeSingle();

  if (batchError) {
    throw batchError;
  }

  if (!batch || batch.status !== "processing" || batch.processed_at) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "只有处理中断且尚未完成计算的批次可以重置。",
    });
  }

  const didReset = await resetInterruptedBatch(batchId);

  if (!didReset) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "该批次状态已变化，请刷新后重试。",
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/batches");
  revalidatePath(`/admin/batches/${batchId}`);
  redirect(`/admin/batches/${batchId}`);
}
