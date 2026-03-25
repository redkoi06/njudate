import "server-only";

import {
  matchingPolicySchema,
  type MatchingPolicy,
} from "@/lib/matching/policy";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

import { summarizeMatchingPolicy } from "@/features/admin/questionnaires/schema";

export type AdminBatchSummary = {
  code: string;
  id: string;
  label: string;
  lastErrorMessage: string | null;
  lockedCount: number;
  matchRunAt: string;
  matchingPolicy: MatchingPolicy;
  matchingPolicySummary: string[];
  notes: string | null;
  participationCount: number;
  processedAt: string | null;
  publishedAt: string | null;
  publishedResultCount: number;
  questionnaireVersionId: string;
  resultPublishAt: string;
  roundNo: number;
  signupEndAt: string;
  signupStartAt: string;
  status: "draft" | "open" | "locked" | "processing" | "published" | "failed";
  unmatchedCount: number;
};

export type AdminBatchDetail = AdminBatchSummary & {
  operationLogs: Array<{
    actionType: string;
    actorRole: string;
    createdAt: string;
    id: string;
    payloadJson: unknown;
  }>;
  questionnaireVersionNo: number | null;
};

export type PublishedQuestionnaireOption = {
  id: string;
  title: string;
  versionNo: number;
};

type ParticipationRow = {
  batch_id: string;
  status: "joined" | "cancelled" | "locked";
};

type MatchResultRow = {
  batch_id: string;
  released_at: string | null;
  status: "pending" | "matched" | "unmatched" | "error" | "expired";
};

function summarizeMetrics(
  batchId: string,
  participations: ParticipationRow[],
  results: MatchResultRow[],
) {
  const batchParticipations = participations.filter(
    (participation) => participation.batch_id === batchId,
  );
  const batchResults = results.filter((result) => result.batch_id === batchId);

  return {
    lockedCount: batchParticipations.filter(
      (participation) => participation.status === "locked",
    ).length,
    participationCount: batchParticipations.filter(
      (participation) =>
        participation.status === "joined" || participation.status === "locked",
    ).length,
    publishedResultCount: batchResults.filter((result) => Boolean(result.released_at)).length,
    unmatchedCount: batchResults.filter((result) => result.status === "unmatched").length,
  };
}

function toBatchSummary(input: {
  batch: {
    code: string;
    id: string;
    last_error_message: string | null;
    label: string;
    match_run_at: string;
    matching_policy_snapshot_json: unknown;
    notes: string | null;
    processed_at: string | null;
    published_at: string | null;
    questionnaire_version_id: string;
    result_publish_at: string;
    round_no: number;
    signup_end_at: string;
    signup_start_at: string;
    status: "draft" | "open" | "locked" | "processing" | "published" | "failed";
  };
  participations: ParticipationRow[];
  results: MatchResultRow[];
}) {
  const matchingPolicy = matchingPolicySchema.parse(
    input.batch.matching_policy_snapshot_json,
  );
  const metrics = summarizeMetrics(
    input.batch.id,
    input.participations,
    input.results,
  );

  return {
    code: input.batch.code,
    id: input.batch.id,
    label: input.batch.label,
    lastErrorMessage: input.batch.last_error_message,
    lockedCount: metrics.lockedCount,
    matchRunAt: input.batch.match_run_at,
    matchingPolicy,
    matchingPolicySummary: summarizeMatchingPolicy(matchingPolicy),
    notes: input.batch.notes,
    participationCount: metrics.participationCount,
    processedAt: input.batch.processed_at,
    publishedAt: input.batch.published_at,
    publishedResultCount: metrics.publishedResultCount,
    questionnaireVersionId: input.batch.questionnaire_version_id,
    resultPublishAt: input.batch.result_publish_at,
    roundNo: input.batch.round_no,
    signupEndAt: input.batch.signup_end_at,
    signupStartAt: input.batch.signup_start_at,
    status: input.batch.status,
    unmatchedCount: metrics.unmatchedCount,
  } satisfies AdminBatchSummary;
}

export async function listPublishedQuestionnaireOptions() {
  const admin = createAdminSupabaseClient();
  const { data, error } = await admin
    .from("questionnaire_versions")
    .select("id, version_no, title")
    .eq("status", "published")
    .order("version_no", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    versionNo: item.version_no,
  })) satisfies PublishedQuestionnaireOption[];
}

export async function listBatches() {
  const admin = createAdminSupabaseClient();
  const { data: batches, error: batchError } = await admin
    .from("match_batches")
    .select(
      "id, round_no, code, label, questionnaire_version_id, signup_start_at, signup_end_at, match_run_at, result_publish_at, status, notes, processed_at, published_at, last_error_message, matching_policy_snapshot_json",
    )
    .order("round_no", { ascending: false });

  if (batchError) {
    throw batchError;
  }

  const batchIds = (batches ?? []).map((batch) => batch.id);
  const [participationsResult, resultsResult] = await Promise.all([
    batchIds.length
      ? admin
          .from("batch_participations")
          .select("batch_id, status")
          .in("batch_id", batchIds)
      : Promise.resolve({ data: [], error: null }),
    batchIds.length
      ? admin
          .from("match_results")
          .select("batch_id, status, released_at")
          .in("batch_id", batchIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (participationsResult.error) {
    throw participationsResult.error;
  }

  if (resultsResult.error) {
    throw resultsResult.error;
  }

  return (batches ?? []).map((batch) =>
    toBatchSummary({
      batch,
      participations: participationsResult.data ?? [],
      results: resultsResult.data ?? [],
    }),
  );
}

export async function getBatchDetail(batchId: string) {
  const admin = createAdminSupabaseClient();
  const [batchResult, participationsResult, resultsResult, logsResult, questionnaireVersionResult] =
    await Promise.all([
      admin
        .from("match_batches")
        .select(
          "id, round_no, code, label, questionnaire_version_id, signup_start_at, signup_end_at, match_run_at, result_publish_at, status, notes, processed_at, published_at, last_error_message, matching_policy_snapshot_json",
        )
        .eq("id", batchId)
        .maybeSingle(),
      admin
        .from("batch_participations")
        .select("batch_id, status")
        .eq("batch_id", batchId),
      admin
        .from("match_results")
        .select("batch_id, status, released_at")
        .eq("batch_id", batchId),
      admin
        .from("operation_logs")
        .select("id, action_type, actor_role, created_at, payload_json")
        .eq("entity_type", "match_batch")
        .eq("entity_id", batchId)
        .order("created_at", { ascending: false })
        .limit(8),
      admin
        .from("match_batches")
        .select("questionnaire_version_id")
        .eq("id", batchId)
        .maybeSingle(),
    ]);

  if (batchResult.error) {
    throw batchResult.error;
  }

  if (participationsResult.error) {
    throw participationsResult.error;
  }

  if (resultsResult.error) {
    throw resultsResult.error;
  }

  if (logsResult.error) {
    throw logsResult.error;
  }

  if (questionnaireVersionResult.error) {
    throw questionnaireVersionResult.error;
  }

  if (!batchResult.data) {
    return null;
  }

  const versionNoResult = questionnaireVersionResult.data?.questionnaire_version_id
    ? await admin
        .from("questionnaire_versions")
        .select("version_no")
        .eq("id", questionnaireVersionResult.data.questionnaire_version_id)
        .maybeSingle()
    : { data: null, error: null };

  if (versionNoResult.error) {
    throw versionNoResult.error;
  }

  const summary = toBatchSummary({
    batch: batchResult.data,
    participations: participationsResult.data ?? [],
    results: resultsResult.data ?? [],
  });

  return {
    ...summary,
    operationLogs: (logsResult.data ?? []).map((log) => ({
      actionType: log.action_type,
      actorRole: log.actor_role,
      createdAt: log.created_at,
      id: log.id,
      payloadJson: log.payload_json,
    })),
    questionnaireVersionNo: versionNoResult.data?.version_no ?? null,
  } satisfies AdminBatchDetail;
}
