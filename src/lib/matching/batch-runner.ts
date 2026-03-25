import "server-only";

import { randomUUID } from "node:crypto";

import {
  buildPairCandidates,
  selectGreedyPairs,
  type MatchingParticipant,
  type MatchingProfileSnapshot,
  type MatchingQuestion,
} from "@/lib/matching/engine";
import { matchingPolicySchema } from "@/lib/matching/policy";
import { sendTransactionalEmail } from "@/lib/email/send";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.generated";

type BatchProcessRow = {
  id: string;
  label: string;
  processed_at: string | null;
  matching_policy_snapshot_json: Json;
  questionnaire_version_id: string;
  status: "draft" | "open" | "locked" | "processing" | "published" | "failed";
};

const MATCH_SOURCE_TYPE = "match_result";
type BatchProcessingClaimStatus = "failed" | "locked";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asAnswerRecord(value: Json): Record<string, string | string[] | number> {
  if (!isObjectRecord(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string | string[] | number] => {
      const candidate = entry[1];

      return (
        typeof candidate === "string" ||
        typeof candidate === "number" ||
        (Array.isArray(candidate) &&
          candidate.every((item) => typeof item === "string"))
      );
    }),
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

async function writeOperationLog(input: {
  actionType: string;
  actorRole?: string;
  entityId: string;
  payloadJson?: Json;
}) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin.from("operation_logs").insert({
    actor_role: input.actorRole ?? "system",
    action_type: input.actionType,
    entity_type: "match_batch",
    entity_id: input.entityId,
    payload_json: input.payloadJson ?? null,
  });

  if (error) {
    throw error;
  }
}

async function markBatchFailed(input: {
  actionType: string;
  batchId: string;
  error: unknown;
}) {
  const admin = createAdminSupabaseClient();
  const errorMessage = getErrorMessage(input.error);

  const { error: updateError } = await admin
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

  await writeOperationLog({
    actionType: input.actionType,
    entityId: input.batchId,
    payloadJson: {
      error_message: errorMessage,
    },
  });
}

async function fetchBatch(batchId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("match_batches")
    .select(
      "id, label, processed_at, questionnaire_version_id, matching_policy_snapshot_json, status",
    )
    .eq("id", batchId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("批次不存在。");
  }

  return data satisfies BatchProcessRow;
}

async function claimBatchForProcessing(input: {
  batchId: string;
  fromStatus: BatchProcessingClaimStatus;
}) {
  const admin = createAdminSupabaseClient();
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

  const { data, error } = await admin
    .from("match_batches")
    .update(updatePayload)
    .eq("id", input.batchId)
    .eq("status", input.fromStatus)
    .select(
      "id, label, processed_at, questionnaire_version_id, matching_policy_snapshot_json, status",
    )
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return data satisfies BatchProcessRow;
}

async function lockJoinedParticipations(batchId: string, nowIso: string) {
  const admin = createAdminSupabaseClient();
  const { error } = await admin
    .from("batch_participations")
    .update({
      status: "locked",
      locked_at: nowIso,
    })
    .eq("batch_id", batchId)
    .eq("status", "joined");

  if (error) {
    throw error;
  }
}

async function getParticipants(input: {
  batchId: string;
  questionnaireVersionId: string;
}) {
  const admin = createAdminSupabaseClient();
  const { data: participations, error: participationsError } = await admin
    .from("batch_participations")
    .select("id, user_id, questionnaire_submission_id, profile_snapshot_json")
    .eq("batch_id", input.batchId)
    .eq("status", "locked");

  if (participationsError) {
    throw participationsError;
  }

  const submissionIds = [
    ...new Set(
      (participations ?? []).map((item) => item.questionnaire_submission_id),
    ),
  ];

  const { data: submissions, error: submissionsError } = submissionIds.length
    ? await admin
        .from("questionnaire_submissions")
        .select("id, answers_json")
        .in("id", submissionIds)
    : { data: [], error: null };

  if (submissionsError) {
    throw submissionsError;
  }

  const answersBySubmissionId = new Map(
    (submissions ?? []).map((submission) => [
      submission.id,
      asAnswerRecord(submission.answers_json),
    ]),
  );

  return (participations ?? []).flatMap((participation) => {
    const answers = answersBySubmissionId.get(participation.questionnaire_submission_id);

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

async function getMatchingQuestions(questionnaireVersionId: string) {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("questionnaire_questions")
    .select(
      "question_code, kind, prompt, options_json, scale_min, scale_max, weight",
    )
    .eq("questionnaire_version_id", questionnaireVersionId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((question) => ({
    kind: question.kind,
    options: mapQuestionOptions(question.options_json),
    prompt: question.prompt,
    questionCode: question.question_code,
    scaleMax: question.scale_max,
    scaleMin: question.scale_min,
    weight: question.weight,
  })) satisfies MatchingQuestion[];
}

async function deleteMatchResultNotificationsForBatch(batchId: string) {
  const admin = createAdminSupabaseClient();
  const { data: results, error: resultsError } = await admin
    .from("match_results")
    .select("id")
    .eq("batch_id", batchId);

  if (resultsError) {
    throw resultsError;
  }

  const resultIds = (results ?? []).map((result) => result.id);
  if (resultIds.length === 0) {
    return;
  }

  const { error: deleteNotificationsError } = await admin
    .from("notifications")
    .delete()
    .eq("source_type", MATCH_SOURCE_TYPE)
    .in("source_id", resultIds);

  if (deleteNotificationsError) {
    throw deleteNotificationsError;
  }
}

async function syncPendingMatchResultEmails(batchId: string) {
  const admin = createAdminSupabaseClient();
  const { data: results, error: resultsError } = await admin
    .from("match_results")
    .select("id")
    .eq("batch_id", batchId)
    .not("released_at", "is", null);

  if (resultsError) {
    throw resultsError;
  }

  const resultIds = (results ?? []).map((result) => result.id);
  if (resultIds.length === 0) {
    return;
  }

  const { data: notifications, error: notificationsError } = await admin
    .from("notifications")
    .select("id, user_id, title, body, email_status, source_id")
    .eq("source_type", MATCH_SOURCE_TYPE)
    .eq("email_status", "pending")
    .in("source_id", resultIds);

  if (notificationsError) {
    throw notificationsError;
  }

  for (const notification of notifications ?? []) {
    try {
      const authResult = await admin.auth.admin.getUserById(notification.user_id);
      const email = authResult.data.user?.email ?? null;

      if (!email) {
        await admin
          .from("notifications")
          .update({ email_status: "failed", emailed_at: null })
          .eq("id", notification.id);
        continue;
      }

      const emailResult = await sendTransactionalEmail({
        to: email,
        subject: notification.title,
        text: notification.body,
      });

      await admin
        .from("notifications")
        .update({
          email_status: emailResult.ok ? "sent" : "failed",
          emailed_at: emailResult.ok ? new Date().toISOString() : null,
        })
        .eq("id", notification.id);
    } catch (error) {
      await admin
        .from("notifications")
        .update({ email_status: "failed", emailed_at: null })
        .eq("id", notification.id);

      await writeOperationLog({
        actionType: "batch_publish_email_failed",
        entityId: batchId,
        payloadJson: {
          notification_id: notification.id,
          error_message: getErrorMessage(error),
        },
      });
    }
  }
}

export async function lockBatch(batchId: string) {
  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();
  const batch = await fetchBatch(batchId);

  if (batch.status !== "open") {
    throw new Error("只有 open 批次可以锁定。");
  }

  const { error: updateError } = await admin
    .from("match_batches")
    .update({
      status: "locked",
      last_error_message: null,
    })
    .eq("id", batchId)
    .eq("status", "open");

  if (updateError) {
    throw updateError;
  }

  await lockJoinedParticipations(batchId, nowIso);
  await writeOperationLog({
    actionType: "batch_locked",
    entityId: batchId,
  });
}

async function processClaimedBatch(batch: BatchProcessRow) {
  const admin = createAdminSupabaseClient();

  try {
    const nowIso = new Date().toISOString();
    const matchingPolicy = matchingPolicySchema.parse(
      batch.matching_policy_snapshot_json,
    );

    await lockJoinedParticipations(batch.id, nowIso);

    const [participants, questions] = await Promise.all([
      getParticipants({
        batchId: batch.id,
        questionnaireVersionId: batch.questionnaire_version_id,
      }),
      getMatchingQuestions(batch.questionnaire_version_id),
    ]);

    await deleteMatchResultNotificationsForBatch(batch.id);

    const { error: deleteResultsError } = await admin
      .from("match_results")
      .delete()
      .eq("batch_id", batch.id);

    if (deleteResultsError) {
      throw deleteResultsError;
    }

    const { error: deletePairsError } = await admin
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

    const { selected, usedParticipationIds } = selectGreedyPairs(pairCandidates);

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
          id: randomUUID(),
          batch_id: batch.id,
          left_participation_id: ordered.left.participationId,
          left_user_id: ordered.left.userId,
          right_participation_id: ordered.right.participationId,
          right_user_id: ordered.right.userId,
        };
      });

      const { error: pairInsertError } = await admin
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
            id: randomUUID(),
            batch_id: batch.id,
            user_id: candidate.left.userId,
            participation_id: candidate.left.participationId,
            match_pair_id: pairId,
            status: "matched" as const,
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
            id: randomUUID(),
            batch_id: batch.id,
            user_id: candidate.right.userId,
            participation_id: candidate.right.participationId,
            match_pair_id: pairId,
            status: "matched" as const,
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

      const { error: resultInsertError } = await admin
        .from("match_results")
        .insert(resultRows);

      if (resultInsertError) {
        throw resultInsertError;
      }
    }

    const unmatchedRows = participants
      .filter((participant) => !usedParticipationIds.has(participant.participationId))
      .map((participant) => ({
        id: randomUUID(),
        batch_id: batch.id,
        user_id: participant.userId,
        participation_id: participant.participationId,
        match_pair_id: null,
        status: "unmatched" as const,
        counterpart_snapshot_json: null,
        score: null,
        preview_text: "No match this round.",
        reasons: null,
        shared_signals: null,
        released_at: null,
      }));

    if (unmatchedRows.length > 0) {
      const { error: unmatchedInsertError } = await admin
        .from("match_results")
        .insert(unmatchedRows);

      if (unmatchedInsertError) {
        throw unmatchedInsertError;
      }
    }

    const { error: completeError } = await admin
      .from("match_batches")
      .update({
        status: "processing",
        processed_at: nowIso,
        last_error_message: null,
      })
      .eq("id", batch.id);

    if (completeError) {
      throw completeError;
    }

    await writeOperationLog({
      actionType: "batch_processed",
      entityId: batch.id,
      payloadJson: {
        matched_pair_count: selected.length,
        unmatched_count: unmatchedRows.length,
      },
    });
  } catch (error) {
    await markBatchFailed({
      actionType: "batch_process_failed",
      batchId: batch.id,
      error,
    });
    throw error;
  }
}

export async function processBatch(batchId: string) {
  const batch = await claimBatchForProcessing({
    batchId,
    fromStatus: "locked",
  });

  if (!batch) {
    return false;
  }

  await processClaimedBatch(batch);
  return true;
}

export async function publishBatch(batchId: string) {
  const admin = createAdminSupabaseClient();
  const batch = await fetchBatch(batchId);

  if (batch.status === "published") {
    throw new Error("已发布批次不能重复发布。");
  }

  try {
    const { error: publishError } = await admin.rpc("publish_match_batch", {
      p_batch_id: batchId,
    });

    if (publishError) {
      throw publishError;
    }
  } catch (error) {
    await markBatchFailed({
      actionType: "batch_publish_failed",
      batchId,
      error,
    });
    throw error;
  }

  try {
    await syncPendingMatchResultEmails(batchId);
  } catch (error) {
    await writeOperationLog({
      actionType: "batch_publish_email_sync_failed",
      entityId: batchId,
      payloadJson: {
        error_message: getErrorMessage(error),
      },
    });
  }
}

export async function rerunFailedBatch(batchId: string) {
  const batch = await claimBatchForProcessing({
    batchId,
    fromStatus: "failed",
  });

  if (!batch) {
    return false;
  }

  await processClaimedBatch(batch);
  return true;
}

export async function resetInterruptedBatch(batchId: string) {
  const admin = createAdminSupabaseClient();
  const errorMessage = "批次处理过程中断，已由管理员重置为 failed，请重新执行匹配。";

  const { data, error } = await admin
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

  await writeOperationLog({
    actionType: "batch_processing_reset",
    entityId: batchId,
    payloadJson: {
      error_message: errorMessage,
    },
  });

  return true;
}
