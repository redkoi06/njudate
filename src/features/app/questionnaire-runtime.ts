import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Json } from "@/types/database.generated";

export type QuestionnaireWindowStatus = "open" | "closed";

type MatchBatchRow = Database["public"]["Tables"]["match_batches"]["Row"];
type QuestionnaireVersionRow = Database["public"]["Tables"]["questionnaire_versions"]["Row"];

type RelevantBatchContext = Pick<
  MatchBatchRow,
  | "id"
  | "questionnaire_version_id"
  | "signup_end_at"
  | "result_publish_at"
  | "status"
>;

export type EffectiveQuestionnaireContext = {
  batchId: string | null;
  batchStatus: MatchBatchRow["status"] | null;
  description: string;
  matchingPolicyJson: Json;
  resultPublishAt: string | null;
  signupEndAt: string | null;
  source: "batch" | "published";
  title: string;
  versionId: string;
  versionNo: number;
  versionStatus: QuestionnaireVersionRow["status"];
  windowStatus: QuestionnaireWindowStatus;
};

function selectRelevantBatch(
  batches: RelevantBatchContext[],
  nowIso: string,
) {
  return (
    batches.find((batch) =>
      batch.status === "open" ||
      batch.status === "locked" ||
      batch.status === "processing" ||
      batch.status === "failed",
    ) ??
    batches.find(
      (batch) =>
        batch.status === "published" &&
        batch.result_publish_at > nowIso,
    ) ??
    null
  );
}

function getWindowStatus(
  batch: RelevantBatchContext | null,
  nowIso: string,
): QuestionnaireWindowStatus {
  if (!batch) {
    return "open";
  }

  if (batch.status === "open" && batch.signup_end_at > nowIso) {
    return "open";
  }

  return batch.result_publish_at > nowIso ? "closed" : "open";
}

export async function getEffectiveQuestionnaireContext(
  supabase: SupabaseClient<Database>,
) {
  const nowIso = new Date().toISOString();
  const { data: recentBatches, error: batchError } = await supabase
    .from("match_batches")
    .select(
      "id, questionnaire_version_id, signup_end_at, result_publish_at, status",
    )
    .in("status", ["open", "locked", "processing", "failed", "published"])
    .order("signup_end_at", { ascending: false })
    .limit(10);

  if (batchError) {
    throw batchError;
  }

  const relevantBatch = selectRelevantBatch(recentBatches ?? [], nowIso);
  const windowStatus = getWindowStatus(relevantBatch, nowIso);

  if (relevantBatch) {
    const { data: version, error: versionError } = await supabase
      .from("questionnaire_versions")
      .select("id, version_no, title, description, status, matching_policy_json")
      .eq("id", relevantBatch.questionnaire_version_id)
      .single();

    if (versionError) {
      throw versionError;
    }

    return {
      batchId: relevantBatch.id,
      batchStatus: relevantBatch.status,
      description: version.description,
      matchingPolicyJson: version.matching_policy_json,
      resultPublishAt: relevantBatch.result_publish_at,
      signupEndAt: relevantBatch.signup_end_at,
      source: "batch",
      title: version.title,
      versionId: version.id,
      versionNo: version.version_no,
      versionStatus: version.status,
      windowStatus,
    } satisfies EffectiveQuestionnaireContext;
  }

  const { data: version, error: versionError } = await supabase
    .from("questionnaire_versions")
    .select("id, version_no, title, description, status, matching_policy_json")
    .eq("status", "published")
    .maybeSingle();

  if (versionError) {
    throw versionError;
  }

  if (!version) {
    return null;
  }

  return {
    batchId: null,
    batchStatus: null,
    description: version.description,
    matchingPolicyJson: version.matching_policy_json,
    resultPublishAt: null,
    signupEndAt: null,
    source: "published",
    title: version.title,
    versionId: version.id,
    versionNo: version.version_no,
    versionStatus: version.status,
    windowStatus: "open",
  } satisfies EffectiveQuestionnaireContext;
}

export function getQuestionnaireStateStatus(input: {
  hasDraft: boolean;
  hasSubmitted: boolean;
}) {
  if (input.hasDraft && input.hasSubmitted) {
    return "updated" as const;
  }

  if (input.hasDraft) {
    return "draft" as const;
  }

  if (input.hasSubmitted) {
    return "submitted" as const;
  }

  return "not_started" as const;
}
