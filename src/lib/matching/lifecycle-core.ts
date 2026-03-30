import type { SupabaseClient } from "@supabase/supabase-js";

import {
  buildPairCandidates,
  selectStablePairs,
  type MatchingParticipant,
  type MatchingProfileSnapshot,
  type MatchingQuestion,
} from "./engine.ts";
import { matchingPolicySchema } from "./policy.ts";
import type { Database, Json } from "../../types/database.generated.ts";

type MatchBatchRow = Database["public"]["Tables"]["match_batches"]["Row"];
type MatchBatchStatus = MatchBatchRow["status"];
type MatchResultStatus =
  Database["public"]["Tables"]["match_results"]["Row"]["status"];
type OperationActorRole = "admin" | "system";

const MATCH_SOURCE_TYPE = "match_result";

type BatchProcessingClaimStatus = "failed" | "locked";

type AdminClientLike = Pick<SupabaseClient<Database>, "from" | "rpc">;

type BatchLifecycleRow = Pick<
  MatchBatchRow,
  | "id"
  | "label"
  | "last_error_message"
  | "match_run_at"
  | "matching_policy_snapshot_json"
  | "processed_at"
  | "questionnaire_version_id"
  | "result_publish_at"
  | "signup_end_at"
  | "signup_start_at"
  | "status"
>;

type ParticipationRow = Pick<
  Database["public"]["Tables"]["batch_participations"]["Row"],
  "id" | "profile_snapshot_json" | "questionnaire_submission_id" | "user_id"
>;

type MatchingQuestionRow = Pick<
  Database["public"]["Tables"]["questionnaire_questions"]["Row"],
  | "kind"
  | "options_json"
  | "prompt"
  | "question_code"
  | "scale_max"
  | "scale_min"
  | "weight"
>;

type NotificationRow = Pick<
  Database["public"]["Tables"]["notifications"]["Row"],
  "body" | "id" | "source_id" | "title" | "user_id"
>;

export type BatchLifecycleContext = {
  admin: AdminClientLike;
  actorRole?: OperationActorRole | undefined;
  afterPublish?: ((batchId: string) => Promise<void>) | undefined;
  createUuid?: (() => string) | undefined;
  nowIso: string;
};

export type BatchAutomationStep =
  | "opened"
  | "locked"
  | "processed"
  | "published";

export type BatchAutomationResult = {
  actions: BatchAutomationStep[];
  batchId: string;
  finalStatus: MatchBatchStatus | null;
  processedAt: string | null;
};

export type BatchAutomationSweepResult = {
  nowIso: string;
  results: BatchAutomationResult[];
};

function getActorRole(context: BatchLifecycleContext) {
  return context.actorRole ?? "system";
}

function getCreateUuid(context: BatchLifecycleContext) {
  return context.createUuid ?? (() => crypto.randomUUID());
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asAnswerRecord(
  value: Json,
): Record<string, string | string[] | number> {
  if (!isObjectRecord(value)) {
    return {} as Record<string, string | string[] | number>;
  }

  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string | string[] | number] => {
        const candidate = entry[1];

        return (
          typeof candidate === "string" ||
          typeof candidate === "number" ||
          (Array.isArray(candidate) &&
            candidate.every((item) => typeof item === "string"))
        );
      },
    ),
  );
}

function asProfileSnapshot(value: Json): MatchingProfileSnapshot {
  if (!isObjectRecord(value)) {
    return {};
  }

  return {
    birth_year:
      typeof value.birth_year === "number" && Number.isInteger(value.birth_year)
        ? value.birth_year
        : null,
    campus: typeof value.campus === "string" ? value.campus : null,
    department: typeof value.department === "string" ? value.department : null,
    gender: typeof value.gender === "string" ? value.gender : null,
    grade: typeof value.grade === "string" ? value.grade : null,
    nickname: typeof value.nickname === "string" ? value.nickname : null,
  };
}

function mapQuestionOptions(optionsJson: Json | null) {
  if (!Array.isArray(optionsJson)) {
    return [];
  }

  return optionsJson.flatMap((option) => {
    if (
      isObjectRecord(option) &&
      typeof option.id === "string" &&
      typeof option.label === "string"
    ) {
      return [{ id: option.id, label: option.label }];
    }

    return [];
  });
}

function buildCounterpartSnapshot(profileSnapshot: MatchingProfileSnapshot) {
  return {
    nickname: profileSnapshot.nickname ?? null,
    gender: profileSnapshot.gender ?? null,
    grade: profileSnapshot.grade ?? null,
    department: profileSnapshot.department ?? null,
    campus: profileSnapshot.campus ?? null,
    birthYear: profileSnapshot.birth_year ?? null,
  } satisfies Record<string, unknown>;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return "未知错误";
  }
}

async function writeOperationLog(
  context: BatchLifecycleContext,
  input: {
    actionType: string;
    entityId: string;
    payloadJson?: Json;
  },
) {
  const { error } = await context.admin.from("operation_logs").insert({
    actor_role: getActorRole(context),
    action_type: input.actionType,
    entity_type: "match_batch",
    entity_id: input.entityId,
    payload_json: input.payloadJson ?? null,
  });

  if (error) {
    throw error;
  }
}

async function markBatchFailed(
  context: BatchLifecycleContext,
  input: {
    actionType: string;
    batchId: string;
    error: unknown;
  },
) {
  const errorMessage = getErrorMessage(input.error);

  const { error: updateError } = await context.admin
    .from("match_batches")
    .update({
      status: "failed",
      last_error_message: errorMessage,
    })
    .eq("id", input.batchId)
    .neq("status", "published");

  if (updateError) {
    throw updateError;
  }

  await writeOperationLog(context, {
    actionType: input.actionType,
    entityId: input.batchId,
    payloadJson: {
      error_message: errorMessage,
    },
  });
}

export async function fetchBatchLifecycleState(
  admin: AdminClientLike,
  batchId: string,
) {
  const { data, error } = await admin
    .from("match_batches")
    .select(
      "id, label, last_error_message, signup_start_at, signup_end_at, match_run_at, result_publish_at, processed_at, questionnaire_version_id, matching_policy_snapshot_json, status",
    )
    .eq("id", batchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as BatchLifecycleRow | null;
}

async function listAutomationCandidateBatchIds(admin: AdminClientLike) {
  const { data, error } = await admin
    .from("match_batches")
    .select("id")
    .in("status", ["draft", "open", "locked", "processing"])
    .order("signup_start_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((batch: { id: string }) =>
    typeof batch.id === "string" ? [batch.id] : [],
  );
}

function assertBatchExists(batch: BatchLifecycleRow | null) {
  if (!batch) {
    throw new Error("批次不存在。");
  }

  return batch;
}

export function isBatchReadyToOpen(batch: BatchLifecycleRow, nowIso: string) {
  return batch.status === "draft" && batch.signup_start_at <= nowIso;
}

export function isBatchReadyToLock(batch: BatchLifecycleRow, nowIso: string) {
  return batch.status === "open" && batch.signup_end_at <= nowIso;
}

export function isBatchReadyToProcess(
  batch: BatchLifecycleRow,
  nowIso: string,
) {
  return batch.status === "locked" && batch.match_run_at <= nowIso;
}

export function isBatchReadyToPublish(
  batch: BatchLifecycleRow,
  nowIso: string,
) {
  return (
    batch.status === "processing" &&
    Boolean(batch.processed_at) &&
    batch.result_publish_at <= nowIso
  );
}

export function hasReachedBatchTime(plannedAt: string, nowIso: string) {
  return plannedAt <= nowIso;
}

async function lockJoinedParticipations(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const { error } = await context.admin
    .from("batch_participations")
    .update({
      status: "locked",
      locked_at: context.nowIso,
    })
    .eq("batch_id", batchId)
    .eq("status", "joined");

  if (error) {
    throw error;
  }
}

async function getParticipants(
  context: BatchLifecycleContext,
  input: {
    batchId: string;
  },
) {
  const { data: participations, error: participationsError } =
    await context.admin
      .from("batch_participations")
      .select("id, user_id, questionnaire_submission_id, profile_snapshot_json")
      .eq("batch_id", input.batchId)
      .eq("status", "locked");

  if (participationsError) {
    throw participationsError;
  }

  const submissionIds = [
    ...new Set(
      (participations ?? []).map(
        (item: ParticipationRow) => item.questionnaire_submission_id,
      ),
    ),
  ];

  const { data: submissions, error: submissionsError } = submissionIds.length
    ? await context.admin
        .from("questionnaire_submissions")
        .select("id, answers_json")
        .in("id", submissionIds)
    : { data: [], error: null };

  if (submissionsError) {
    throw submissionsError;
  }

  const answersBySubmissionId = new Map<
    string,
    Record<string, string | string[] | number>
  >(
    (submissions ?? []).map(
      (submission: { answers_json: Json; id: string }) => [
        submission.id,
        asAnswerRecord(submission.answers_json),
      ],
    ),
  );

  return (participations ?? []).flatMap((participation: ParticipationRow) => {
    const answers = answersBySubmissionId.get(
      participation.questionnaire_submission_id,
    );

    if (!answers) {
      return [];
    }

    return [
      {
        answers,
        participationId: participation.id,
        profileSnapshot: asProfileSnapshot(participation.profile_snapshot_json),
        userId: participation.user_id,
      } satisfies MatchingParticipant,
    ];
  });
}

async function getMatchingQuestions(
  context: BatchLifecycleContext,
  questionnaireVersionId: string,
) {
  const { data, error } = await context.admin
    .from("questionnaire_questions")
    .select(
      "question_code, kind, prompt, options_json, scale_min, scale_max, weight",
    )
    .eq("questionnaire_version_id", questionnaireVersionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((question: MatchingQuestionRow) => ({
    kind: question.kind,
    options: mapQuestionOptions(question.options_json),
    prompt: question.prompt,
    questionCode: question.question_code,
    scaleMax: question.scale_max,
    scaleMin: question.scale_min,
    weight: question.weight,
  })) satisfies MatchingQuestion[];
}

async function deleteMatchResultNotificationsForBatch(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const { data: results, error: resultsError } = await context.admin
    .from("match_results")
    .select("id")
    .eq("batch_id", batchId);

  if (resultsError) {
    throw resultsError;
  }

  const resultIds = (results ?? []).flatMap((result: { id: string }) =>
    typeof result.id === "string" ? [result.id] : [],
  );

  if (resultIds.length === 0) {
    return;
  }

  const { error: deleteNotificationsError } = await context.admin
    .from("notifications")
    .delete()
    .eq("source_type", MATCH_SOURCE_TYPE)
    .in("source_id", resultIds);

  if (deleteNotificationsError) {
    throw deleteNotificationsError;
  }
}

export async function openBatch(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const batch = assertBatchExists(
    await fetchBatchLifecycleState(context.admin, batchId),
  );

  if (batch.status !== "draft") {
    throw new Error("只有 draft 批次可以开放报名。");
  }

  const { data, error } = await context.admin
    .from("match_batches")
    .update({
      status: "open",
      last_error_message: null,
    })
    .eq("id", batchId)
    .eq("status", "draft")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return false;
  }

  await writeOperationLog(context, {
    actionType: "batch_opened",
    entityId: batchId,
  });

  return true;
}

export async function lockBatch(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const batch = assertBatchExists(
    await fetchBatchLifecycleState(context.admin, batchId),
  );

  if (batch.status !== "open") {
    throw new Error("只有 open 批次可以锁定。");
  }

  const { data, error } = await context.admin
    .from("match_batches")
    .update({
      status: "locked",
      last_error_message: null,
    })
    .eq("id", batchId)
    .eq("status", "open")
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return false;
  }

  await lockJoinedParticipations(context, batchId);
  await writeOperationLog(context, {
    actionType: "batch_locked",
    entityId: batchId,
  });

  return true;
}

async function claimBatchForProcessing(
  context: BatchLifecycleContext,
  input: {
    batchId: string;
    fromStatus: BatchProcessingClaimStatus;
  },
) {
  const updatePayload =
    input.fromStatus === "failed"
      ? {
          status: "processing" as const,
          processed_at: null,
          published_at: null,
          last_error_message: null,
        }
      : {
          status: "processing" as const,
          processed_at: null,
          last_error_message: null,
        };

  const { data, error } = await context.admin
    .from("match_batches")
    .update(updatePayload)
    .eq("id", input.batchId)
    .eq("status", input.fromStatus)
    .select(
      "id, label, last_error_message, signup_start_at, signup_end_at, match_run_at, result_publish_at, processed_at, questionnaire_version_id, matching_policy_snapshot_json, status",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as BatchLifecycleRow | null;
}

async function processClaimedBatch(
  context: BatchLifecycleContext,
  batch: BatchLifecycleRow,
) {
  try {
    const matchingPolicy = matchingPolicySchema.parse(
      batch.matching_policy_snapshot_json,
    );

    await lockJoinedParticipations(context, batch.id);

    const [participants, questions] = await Promise.all([
      getParticipants(context, {
        batchId: batch.id,
      }),
      getMatchingQuestions(context, batch.questionnaire_version_id),
    ]);

    await deleteMatchResultNotificationsForBatch(context, batch.id);

    const { error: deleteResultsError } = await context.admin
      .from("match_results")
      .delete()
      .eq("batch_id", batch.id);

    if (deleteResultsError) {
      throw deleteResultsError;
    }

    const { error: deletePairsError } = await context.admin
      .from("match_pairs")
      .delete()
      .eq("batch_id", batch.id);

    if (deletePairsError) {
      throw deletePairsError;
    }

    const pairCandidates = buildPairCandidates({
      matchingPolicy,
      participants,
      questions,
    });

    const { selected, usedParticipationIds } =
      selectStablePairs(pairCandidates);
    const createUuid = getCreateUuid(context);

    if (selected.length > 0) {
      const pairRows = selected.map((candidate) => {
        const ordered =
          candidate.left.participationId < candidate.right.participationId
            ? candidate
            : {
                ...candidate,
                left: candidate.right,
                right: candidate.left,
              };

        return {
          id: createUuid(),
          batch_id: batch.id,
          left_participation_id: ordered.left.participationId,
          left_user_id: ordered.left.userId,
          right_participation_id: ordered.right.participationId,
          right_user_id: ordered.right.userId,
        };
      });

      const { error: pairInsertError } = await context.admin
        .from("match_pairs")
        .insert(pairRows);

      if (pairInsertError) {
        throw pairInsertError;
      }

      const pairIdByParticipants = new Map(
        pairRows.map((row) => [
          `${row.left_participation_id}:${row.right_participation_id}`,
          row.id,
        ]),
      );

      const resultRows = selected.flatMap((candidate) => {
        const ordered =
          candidate.left.participationId < candidate.right.participationId
            ? candidate
            : {
                ...candidate,
                left: candidate.right,
                right: candidate.left,
              };
        const pairId = pairIdByParticipants.get(
          `${ordered.left.participationId}:${ordered.right.participationId}`,
        );

        if (!pairId) {
          return [];
        }

        return [
          {
            id: createUuid(),
            batch_id: batch.id,
            user_id: candidate.left.userId,
            participation_id: candidate.left.participationId,
            match_pair_id: pairId,
            status: "matched" as MatchResultStatus,
            counterpart_snapshot_json: buildCounterpartSnapshot(
              candidate.right.profileSnapshot,
            ),
            score: candidate.score,
            preview_text: candidate.previewText,
            reasons: candidate.reasons,
            shared_signals: candidate.sharedSignals,
            released_at: null,
          },
          {
            id: createUuid(),
            batch_id: batch.id,
            user_id: candidate.right.userId,
            participation_id: candidate.right.participationId,
            match_pair_id: pairId,
            status: "matched" as MatchResultStatus,
            counterpart_snapshot_json: buildCounterpartSnapshot(
              candidate.left.profileSnapshot,
            ),
            score: candidate.score,
            preview_text: candidate.previewText,
            reasons: candidate.reasons,
            shared_signals: candidate.sharedSignals,
            released_at: null,
          },
        ];
      });

      const { error: resultInsertError } = await context.admin
        .from("match_results")
        .insert(resultRows);

      if (resultInsertError) {
        throw resultInsertError;
      }
    }

    const unmatchedRows = participants
      .filter(
        (participant: MatchingParticipant) =>
          !usedParticipationIds.has(participant.participationId),
      )
      .map((participant: MatchingParticipant) => ({
        id: createUuid(),
        batch_id: batch.id,
        user_id: participant.userId,
        participation_id: participant.participationId,
        match_pair_id: null,
        status: "unmatched" as MatchResultStatus,
        counterpart_snapshot_json: null,
        score: null,
        preview_text: "No match this round.",
        reasons: null,
        shared_signals: null,
        released_at: null,
      }));

    if (unmatchedRows.length > 0) {
      const { error: unmatchedInsertError } = await context.admin
        .from("match_results")
        .insert(unmatchedRows);

      if (unmatchedInsertError) {
        throw unmatchedInsertError;
      }
    }

    const { error: completeError } = await context.admin
      .from("match_batches")
      .update({
        status: "processing",
        processed_at: context.nowIso,
        last_error_message: null,
      })
      .eq("id", batch.id);

    if (completeError) {
      throw completeError;
    }

    await writeOperationLog(context, {
      actionType: "batch_processed",
      entityId: batch.id,
      payloadJson: {
        matched_pair_count: selected.length,
        unmatched_count: unmatchedRows.length,
      },
    });
  } catch (error) {
    await markBatchFailed(context, {
      actionType: "batch_process_failed",
      batchId: batch.id,
      error,
    });
    throw error;
  }
}

export async function processBatch(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const batch = await claimBatchForProcessing(context, {
    batchId,
    fromStatus: "locked",
  });

  if (!batch) {
    return false;
  }

  await processClaimedBatch(context, batch);
  return true;
}

export async function rerunFailedBatch(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const batch = await claimBatchForProcessing(context, {
    batchId,
    fromStatus: "failed",
  });

  if (!batch) {
    return false;
  }

  await processClaimedBatch(context, batch);
  return true;
}

export async function publishBatch(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const batch = assertBatchExists(
    await fetchBatchLifecycleState(context.admin, batchId),
  );

  if (batch.status === "published") {
    throw new Error("已发布批次不能重复发布。");
  }

  try {
    const { error: publishError } = await context.admin.rpc(
      "publish_match_batch",
      {
        p_batch_id: batchId,
      },
    );

    if (publishError) {
      throw publishError;
    }
  } catch (error) {
    await markBatchFailed(context, {
      actionType: "batch_publish_failed",
      batchId,
      error,
    });
    throw error;
  }

  try {
    await context.afterPublish?.(batchId);
  } catch (error) {
    await writeOperationLog(context, {
      actionType: "batch_publish_email_sync_failed",
      entityId: batchId,
      payloadJson: {
        error_message: getErrorMessage(error),
      },
    });
  }
}

export async function resetInterruptedBatch(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const errorMessage =
    "批次处理过程中断，已由管理员重置为 failed，请重新执行匹配。";

  const { data, error } = await context.admin
    .from("match_batches")
    .update({
      status: "failed",
      last_error_message: errorMessage,
    })
    .eq("id", batchId)
    .eq("status", "processing")
    .is("processed_at", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return false;
  }

  await writeOperationLog(context, {
    actionType: "batch_processing_reset",
    entityId: batchId,
    payloadJson: {
      error_message: errorMessage,
    },
  });

  return true;
}

export async function syncMatchResultNotifications(
  context: BatchLifecycleContext,
  input: {
    batchId: string;
    deliver: (notification: NotificationRow) => Promise<void>;
    markNotificationFailed: (notificationId: string) => Promise<void>;
  },
) {
  const { data: results, error: resultsError } = await context.admin
    .from("match_results")
    .select("id")
    .eq("batch_id", input.batchId)
    .not("released_at", "is", null);

  if (resultsError) {
    throw resultsError;
  }

  const resultIds = (results ?? []).flatMap((result: { id: string }) =>
    typeof result.id === "string" ? [result.id] : [],
  );

  if (resultIds.length === 0) {
    return;
  }

  const { data: notifications, error: notificationsError } = await context.admin
    .from("notifications")
    .select("id, source_id, title, body, user_id")
    .eq("source_type", MATCH_SOURCE_TYPE)
    .eq("email_status", "pending")
    .in("source_id", resultIds);

  if (notificationsError) {
    throw notificationsError;
  }

  for (const notification of notifications ?? []) {
    try {
      await input.deliver(notification as NotificationRow);
    } catch (error) {
      await input.markNotificationFailed(notification.id);
      await writeOperationLog(context, {
        actionType: "batch_publish_email_failed",
        entityId: input.batchId,
        payloadJson: {
          notification_id: notification.id,
          error_message: getErrorMessage(error),
        },
      });
    }
  }
}

export async function advanceBatchByTime(
  context: BatchLifecycleContext,
  batchId: string,
) {
  const actions: BatchAutomationStep[] = [];

  for (let step = 0; step < 6; step += 1) {
    const batch = await fetchBatchLifecycleState(context.admin, batchId);

    if (!batch) {
      return {
        actions,
        batchId,
        finalStatus: null,
        processedAt: null,
      } satisfies BatchAutomationResult;
    }

    if (isBatchReadyToOpen(batch, context.nowIso)) {
      const didOpen = await openBatch(context, batchId);

      if (!didOpen) {
        break;
      }

      actions.push("opened");
      continue;
    }

    if (isBatchReadyToLock(batch, context.nowIso)) {
      const didLock = await lockBatch(context, batchId);

      if (!didLock) {
        break;
      }

      actions.push("locked");
      continue;
    }

    if (isBatchReadyToProcess(batch, context.nowIso)) {
      const didProcess = await processBatch(context, batchId);

      if (!didProcess) {
        break;
      }

      actions.push("processed");
      continue;
    }

    if (isBatchReadyToPublish(batch, context.nowIso)) {
      await publishBatch(context, batchId);
      actions.push("published");
      continue;
    }

    break;
  }

  const finalBatch = await fetchBatchLifecycleState(context.admin, batchId);

  return {
    actions,
    batchId,
    finalStatus: finalBatch?.status ?? null,
    processedAt: finalBatch?.processed_at ?? null,
  } satisfies BatchAutomationResult;
}

export async function runBatchAutomationSweep(context: BatchLifecycleContext) {
  const batchIds = await listAutomationCandidateBatchIds(context.admin);
  const results: BatchAutomationResult[] = [];

  for (const batchId of batchIds) {
    const result = await advanceBatchByTime(context, batchId);

    if (result.actions.length > 0) {
      results.push(result);
    }
  }

  return {
    nowIso: context.nowIso,
    results,
  } satisfies BatchAutomationSweepResult;
}
