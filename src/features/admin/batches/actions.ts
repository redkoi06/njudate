"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireAdminUser } from "@/lib/auth/session";
import {
  lockBatch,
  openBatch,
  processBatch,
  publishBatch,
  resetInterruptedBatch,
  rerunFailedBatch,
} from "@/lib/matching/batch-runner";
import {
  fetchBatchLifecycleState,
  hasReachedBatchTime,
} from "@/lib/matching/lifecycle-core";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.generated";

const batchDraftSchema = z
  .object({
    questionnaireVersionId: z.string().uuid("请选择已发布问卷版本"),
    signupStartAt: z
      .string()
      .trim()
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "请填写有效的开始报名时间",
      )
      .transform((value) => new Date(value).toISOString()),
    signupEndAt: z
      .string()
      .trim()
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "请填写有效的报名截止时间",
      )
      .transform((value) => new Date(value).toISOString()),
    matchRunAt: z
      .string()
      .trim()
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "请填写有效的匹配计算时间",
      )
      .transform((value) => new Date(value).toISOString()),
    resultPublishAt: z
      .string()
      .trim()
      .refine(
        (value) => !Number.isNaN(new Date(value).getTime()),
        "请填写有效的结果发布时间",
      )
      .transform((value) => new Date(value).toISOString()),
    notes: z.string().trim().optional(),
  })
  .superRefine((value, ctx) => {
    const signupStartAt = new Date(value.signupStartAt);
    const signupEndAt = new Date(value.signupEndAt);
    const matchRunAt = new Date(value.matchRunAt);
    const resultPublishAt = new Date(value.resultPublishAt);

    if (
      !(
        signupStartAt < signupEndAt &&
        signupEndAt < matchRunAt &&
        matchRunAt < resultPublishAt
      )
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "必须满足 signup_start_at < signup_end_at < match_run_at < result_publish_at",
        path: ["signupStartAt"],
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

async function getPublishedQuestionnaireSnapshot(
  questionnaireVersionId: string,
) {
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
        signupStartAt: stringField(formData, "signupStartAt"),
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

  const { data: createdBatch, error } = await admin
    .from("match_batches")
    .insert({
      code,
      label,
      questionnaire_version_id: questionnaireVersion.id,
      signup_start_at: payload.signupStartAt,
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
        signupStartAt: stringField(formData, "signupStartAt"),
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
    .select("status")
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

  const questionnaireVersion = await getPublishedQuestionnaireSnapshot(
    payload.questionnaireVersionId,
  );

  const { error } = await admin
    .from("match_batches")
    .update({
      questionnaire_version_id: questionnaireVersion.id,
      signup_start_at: payload.signupStartAt,
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
  await requireAdminUser();
  const batchId = stringField(formData, "batchId");
  const admin = createAdminSupabaseClient();

  if (!batchId) {
    redirectWithMessage("/admin/batches", {
      error: "缺少待开放的批次。",
    });
  }

  const { data: batch, error: batchError } = await admin
    .from("match_batches")
    .select("signup_start_at, status")
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

  if (!hasReachedBatchTime(batch.signup_start_at, nowIso)) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "开始报名时间未到，暂时不能打开报名。",
    });
  }

  const didOpen = await openBatch(batchId, "admin");

  if (!didOpen) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "该批次状态已变化，请刷新后重试。",
    });
  }

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
  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();
  const batch = await fetchBatchLifecycleState(admin, batchId);

  if (!batch || batch.status !== "open") {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "只有 open 批次可以锁定。",
    });
  }

  if (!hasReachedBatchTime(batch.signup_end_at, nowIso)) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "报名截止时间未到，暂时不能锁定报名。",
    });
  }

  const didLock = await lockBatch(batchId, "admin");

  if (!didLock) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "该批次状态已变化，请刷新后重试。",
    });
  }

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

  const scheduleBatch = await fetchBatchLifecycleState(admin, batchId);

  if (!scheduleBatch) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "批次不存在。",
    });
  }

  if (
    !hasReachedBatchTime(scheduleBatch.match_run_at, new Date().toISOString())
  ) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "匹配计算时间未到，暂时不能执行匹配。",
    });
  }

  const didProcess =
    batch.status === "failed"
      ? await rerunFailedBatch(batchId, "admin")
      : await processBatch(batchId, "admin");

  if (!didProcess) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "该批次已在处理或状态已变化，请刷新后重试。",
    });
  }

  const nowIso = new Date().toISOString();
  const processedBatch = await fetchBatchLifecycleState(admin, batchId);

  if (
    processedBatch &&
    processedBatch.status === "processing" &&
    processedBatch.processed_at &&
    hasReachedBatchTime(processedBatch.result_publish_at, nowIso)
  ) {
    await publishBatch(batchId, "admin");
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

  const scheduleBatch = await fetchBatchLifecycleState(admin, batchId);

  if (!scheduleBatch) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "批次不存在。",
    });
  }

  if (
    !hasReachedBatchTime(
      scheduleBatch.result_publish_at,
      new Date().toISOString(),
    )
  ) {
    redirectWithMessage(`/admin/batches/${batchId}`, {
      error: "结果发布时间未到，暂时不能公布结果。",
    });
  }

  await publishBatch(batchId, "admin");
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
