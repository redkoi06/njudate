import "server-only";

import { randomUUID } from "node:crypto";

import { sendTransactionalEmail } from "@/lib/email/send";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Json } from "@/types/database.generated";

type QuestionRow = {
  id: string;
  question_code: string;
  kind: "text" | "single" | "multiple" | "scale";
  prompt: string;
  options_json: Json | null;
  scale_min: number | null;
  scale_max: number | null;
};

type Participant = {
  participationId: string;
  userId: string;
  answers: Record<string, string | string[] | number>;
  profileSnapshot: Record<string, unknown>;
};

type CandidateReason = {
  score: number;
  reason: string;
  signal?: string | undefined;
};

type QuestionComparison = {
  score: number;
  reason?: string;
  signal?: string;
};

type PairCandidate = {
  left: Participant;
  right: Participant;
  score: number;
  comparableCount: number;
  reasons: string[];
  sharedSignals: string[];
  previewText: string;
};

type BatchRunSummary = {
  lockedBatchIds: string[];
  processedBatchIds: string[];
  publishedBatchIds: string[];
};

const MATCH_SOURCE_TYPE = "match_result";
const SYSTEM_ACTOR_ROLE = "system";
const SCORABLE_KINDS = new Set(["single", "multiple", "scale"]);

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

function asProfileSnapshot(value: Json): Record<string, unknown> {
  if (!isObjectRecord(value)) {
    return {};
  }

  return value;
}

function getOptionMap(question: QuestionRow) {
  if (!Array.isArray(question.options_json)) {
    return new Map<string, string>();
  }

  return new Map(
    question.options_json.flatMap((item) => {
      if (
        isObjectRecord(item) &&
        typeof item.id === "string" &&
        typeof item.label === "string"
      ) {
        return [[item.id, item.label] as const];
      }

      return [];
    }),
  );
}

function buildCounterpartSnapshot(profileSnapshot: Record<string, unknown>) {
  const snapshot = {
    nickname:
      typeof profileSnapshot.nickname === "string" ? profileSnapshot.nickname : null,
    gender:
      typeof profileSnapshot.gender === "string" ? profileSnapshot.gender : null,
    grade: typeof profileSnapshot.grade === "string" ? profileSnapshot.grade : null,
    department:
      typeof profileSnapshot.department === "string"
        ? profileSnapshot.department
        : null,
    campus:
      typeof profileSnapshot.campus === "string"
        ? profileSnapshot.campus
        : null,
    birthYear:
      typeof profileSnapshot.birth_year === "number" &&
      Number.isInteger(profileSnapshot.birth_year)
        ? profileSnapshot.birth_year
        : null,
  };

  return snapshot satisfies Record<string, unknown>;
}

function buildFallbackReasons(left: Participant, right: Participant) {
  return [
    "你们都愿意完整回答当前问卷，并在本周主动加入匹配。",
    "你们都更适合先从低打扰、稳定节奏的交流开始。",
    `你们分别来自 ${String(left.profileSnapshot.department ?? "校内")} 与 ${String(right.profileSnapshot.department ?? "校内")} 的学习生活背景，具备继续了解的空间。`,
  ];
}

function compareSingleQuestion(
  question: QuestionRow,
  leftAnswer: string,
  rightAnswer: string,
): QuestionComparison {
  const optionMap = getOptionMap(question);
  if (leftAnswer !== rightAnswer) {
    return { score: 0 };
  }

  const label = optionMap.get(leftAnswer) ?? leftAnswer;
  return {
    score: 1,
    reason: `你们在“${question.prompt}”上的选择一致，都更偏向“${label}”。`,
    signal: label,
  };
}

function compareMultipleQuestion(
  question: QuestionRow,
  leftAnswer: string[],
  rightAnswer: string[],
): QuestionComparison | null {
  const leftSet = new Set(leftAnswer);
  const rightSet = new Set(rightAnswer);
  const shared = [...leftSet].filter((item) => rightSet.has(item));
  const union = new Set([...leftSet, ...rightSet]);

  if (union.size === 0) {
    return null;
  }

  const score = shared.length / union.size;
  if (shared.length === 0) {
    return { score };
  }

  const optionMap = getOptionMap(question);
  const labels = shared.map((item) => optionMap.get(item) ?? item);

  return {
    score,
    reason: `你们在“${question.prompt}”里都提到了“${labels.join("、")}”这类偏好。`,
    signal: labels.join("、"),
  };
}

function compareScaleQuestion(
  question: QuestionRow,
  leftAnswer: number,
  rightAnswer: number,
): QuestionComparison | null {
  const min = question.scale_min ?? 1;
  const max = question.scale_max ?? 5;
  const range = max - min;

  if (range <= 0) {
    return null;
  }

  const score = 1 - Math.abs(leftAnswer - rightAnswer) / range;
  if (score <= 0) {
    return { score };
  }

  return {
    score,
    reason:
      score >= 0.7
        ? `你们对“${question.prompt}”的重视程度很接近。`
        : `你们对“${question.prompt}”的判断差异不大。`,
  };
}

function compareQuestion(
  question: QuestionRow,
  leftAnswer: string | string[] | number | undefined,
  rightAnswer: string | string[] | number | undefined,
): QuestionComparison | null {
  if (leftAnswer === undefined || rightAnswer === undefined) {
    return null;
  }

  switch (question.kind) {
    case "single":
      if (typeof leftAnswer !== "string" || typeof rightAnswer !== "string") {
        return null;
      }
      return compareSingleQuestion(question, leftAnswer, rightAnswer);
    case "multiple":
      if (!Array.isArray(leftAnswer) || !Array.isArray(rightAnswer)) {
        return null;
      }
      return compareMultipleQuestion(question, leftAnswer, rightAnswer);
    case "scale":
      if (typeof leftAnswer !== "number" || typeof rightAnswer !== "number") {
        return null;
      }
      return compareScaleQuestion(question, leftAnswer, rightAnswer);
    default:
      return null;
  }
}

function buildPairCandidate(
  left: Participant,
  right: Participant,
  questions: QuestionRow[],
) {
  let totalScore = 0;
  let comparableCount = 0;
  const reasons: CandidateReason[] = [];

  for (const question of questions) {
    const comparison = compareQuestion(
      question,
      left.answers[question.question_code],
      right.answers[question.question_code],
    );

    if (!comparison) {
      continue;
    }

    comparableCount += 1;
    totalScore += comparison.score;

    if (comparison.reason) {
      reasons.push({
        score: comparison.score,
        reason: comparison.reason,
        signal: comparison.signal,
      });
    }
  }

  if (comparableCount === 0) {
    return null;
  }

  const score = Math.round((totalScore / comparableCount) * 100);
  const rankedReasons = reasons
    .sort((leftReason, rightReason) => rightReason.score - leftReason.score)
    .slice(0, 5);

  const reasonTexts = rankedReasons.map((item) => item.reason);
  const signals = rankedReasons.flatMap((item) => (item.signal ? [item.signal] : []));

  while (reasonTexts.length < 3) {
    const fallback = buildFallbackReasons(left, right)[reasonTexts.length];
    if (!fallback) {
      break;
    }
    reasonTexts.push(fallback);
  }

  return {
    left,
    right,
    score,
    comparableCount,
    reasons: reasonTexts.slice(0, 5),
    sharedSignals: signals.slice(0, 5),
    previewText:
      reasonTexts[0] ??
      "你们在多个关键问题上的回答较为接近，适合先从稳定交流开始。",
  } satisfies PairCandidate;
}

function buildParticipants(input: {
  participations: Array<{
    id: string;
    user_id: string;
    questionnaire_submission_id: string;
    profile_snapshot_json: Json;
  }>;
  answersBySubmissionId: Map<string, Record<string, string | string[] | number>>;
}) {
  return input.participations.flatMap((item) => {
    const answers = input.answersBySubmissionId.get(item.questionnaire_submission_id);

    if (!answers) {
      return [];
    }

    return [
      {
        participationId: item.id,
        userId: item.user_id,
        answers,
        profileSnapshot: asProfileSnapshot(item.profile_snapshot_json),
      } satisfies Participant,
    ];
  });
}

function selectGreedyPairs(candidates: PairCandidate[]) {
  const usedParticipationIds = new Set<string>();
  const selected: PairCandidate[] = [];

  for (const candidate of candidates.sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }
    if (right.comparableCount !== left.comparableCount) {
      return right.comparableCount - left.comparableCount;
    }
    return `${left.left.participationId}-${left.right.participationId}`.localeCompare(
      `${right.left.participationId}-${right.right.participationId}`,
    );
  })) {
    if (candidate.score <= 0) {
      continue;
    }

    if (
      usedParticipationIds.has(candidate.left.participationId) ||
      usedParticipationIds.has(candidate.right.participationId)
    ) {
      continue;
    }

    usedParticipationIds.add(candidate.left.participationId);
    usedParticipationIds.add(candidate.right.participationId);
    selected.push(candidate);
  }

  return {
    selected,
    usedParticipationIds,
  };
}

async function lockExpiredOpenBatches(nowIso: string) {
  const admin = createAdminSupabaseClient();
  const { data: batches, error } = await admin
    .from("match_batches")
    .select("id")
    .eq("status", "open")
    .lt("signup_end_at", nowIso);

  if (error) {
    throw error;
  }

  const lockedBatchIds: string[] = [];

  for (const batch of batches ?? []) {
    const { error: batchError } = await admin
      .from("match_batches")
      .update({ status: "locked" })
      .eq("id", batch.id)
      .eq("status", "open");

    if (batchError) {
      throw batchError;
    }

    const { error: participationError } = await admin
      .from("batch_participations")
      .update({
        status: "locked",
        locked_at: nowIso,
      })
      .eq("batch_id", batch.id)
      .eq("status", "joined");

    if (participationError) {
      throw participationError;
    }

    lockedBatchIds.push(batch.id);
  }

  return lockedBatchIds;
}

async function processBatch(batch: {
  id: string;
  questionnaire_version_id: string;
}) {
  const admin = createAdminSupabaseClient();
  const { error: transitionError } = await admin
    .from("match_batches")
    .update({ status: "processing" })
    .eq("id", batch.id);

  if (transitionError) {
    throw transitionError;
  }

  await admin
    .from("batch_participations")
    .update({
      status: "locked",
      locked_at: new Date().toISOString(),
    })
    .eq("batch_id", batch.id)
    .eq("status", "joined");

  const { data: participations, error: participationsError } = await admin
    .from("batch_participations")
    .select("id, user_id, questionnaire_submission_id, profile_snapshot_json")
    .eq("batch_id", batch.id)
    .eq("status", "locked");

  if (participationsError) {
    throw participationsError;
  }

  const { data: questions, error: questionsError } = await admin
    .from("questionnaire_questions")
    .select("id, question_code, kind, prompt, options_json, scale_min, scale_max")
    .eq("questionnaire_version_id", batch.questionnaire_version_id)
    .order("sort_order", { ascending: true });

  if (questionsError) {
    throw questionsError;
  }

  const submissionIds = [...new Set((participations ?? []).map((item) => item.questionnaire_submission_id))];
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
    (submissions ?? []).map((item) => [item.id, asAnswerRecord(item.answers_json)]),
  );
  const participants = buildParticipants({
    participations: participations ?? [],
    answersBySubmissionId,
  });

  const scorableQuestions = (questions ?? []).filter((question) =>
    SCORABLE_KINDS.has(question.kind),
  ) as QuestionRow[];

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

  const pairCandidates: PairCandidate[] = [];
  for (let leftIndex = 0; leftIndex < participants.length; leftIndex += 1) {
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < participants.length;
      rightIndex += 1
    ) {
      const leftParticipant = participants[leftIndex];
      const rightParticipant = participants[rightIndex];

      if (!leftParticipant || !rightParticipant) {
        continue;
      }

      const candidate = buildPairCandidate(
        leftParticipant,
        rightParticipant,
        scorableQuestions,
      );

      if (candidate) {
        pairCandidates.push(candidate);
      }
    }
  }

  const { selected, usedParticipationIds } = selectGreedyPairs(pairCandidates);
  const nowIso = new Date().toISOString();

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

    const pairIdByUsers = new Map(
      pairRows.map((row) => [
        `${row.left_participation_id}:${row.right_participation_id}`,
        row.id,
      ]),
    );

    const matchResults = selected.flatMap((candidate) => {
      const ordered =
        candidate.left.participationId < candidate.right.participationId
          ? candidate
          : {
              ...candidate,
              left: candidate.right,
              right: candidate.left,
            };
      const pairId = pairIdByUsers.get(
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

    const { error: resultsInsertError } = await admin
      .from("match_results")
      .insert(matchResults);

    if (resultsInsertError) {
      throw resultsInsertError;
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
      preview_text: "本轮暂未形成可发布匹配。",
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

  const { error: batchUpdateError } = await admin
    .from("match_batches")
    .update({
      status: "processing",
      processed_at: nowIso,
    })
    .eq("id", batch.id);

  if (batchUpdateError) {
    throw batchUpdateError;
  }

  await admin.from("operation_logs").insert({
    actor_role: SYSTEM_ACTOR_ROLE,
    action_type: "batch_processed",
    entity_type: "match_batch",
    entity_id: batch.id,
    payload_json: {
      matched_pair_count: selected.length,
      unmatched_count: unmatchedRows.length,
    },
  });
}

async function publishBatch(batchId: string) {
  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data: results, error: resultsError } = await admin
    .from("match_results")
    .select("id, user_id, status")
    .eq("batch_id", batchId);

  if (resultsError) {
    throw resultsError;
  }

  const { error: releaseError } = await admin
    .from("match_results")
    .update({ released_at: nowIso })
    .eq("batch_id", batchId)
    .is("released_at", null);

  if (releaseError) {
    throw releaseError;
  }

  const resultIds = (results ?? []).map((item) => item.id);
  const existingNotifications = resultIds.length
    ? await admin
        .from("notifications")
        .select("source_id")
        .eq("source_type", MATCH_SOURCE_TYPE)
        .in("source_id", resultIds)
    : { data: [], error: null };

  if (existingNotifications.error) {
    throw existingNotifications.error;
  }

  const notifiedResultIds = new Set(
    (existingNotifications.data ?? [])
      .map((item) => item.source_id)
      .filter((item): item is string => typeof item === "string"),
  );

  const userIds = [...new Set((results ?? []).map((item) => item.user_id))];
  const { data: userSettings, error: userSettingsError } = userIds.length
    ? await admin
        .from("app_users")
        .select("id, notify_match_result")
        .in("id", userIds)
    : { data: [], error: null };

  if (userSettingsError) {
    throw userSettingsError;
  }

  const settingsMap = new Map(
    (userSettings ?? []).map((item) => [item.id, item.notify_match_result]),
  );

  for (const result of results ?? []) {
    if (notifiedResultIds.has(result.id)) {
      continue;
    }

    const title = "本周匹配结果已发布";
    const body =
      result.status === "matched"
        ? "你的本周匹配结果已经发布，进入站内即可查看理由并决定是否联系。"
        : "你的本周匹配结果已经发布，本轮暂未形成匹配。";

    const wantsEmail = settingsMap.get(result.user_id) ?? false;
    const { data: insertedNotification, error: notificationInsertError } =
      await admin
        .from("notifications")
        .insert({
          user_id: result.user_id,
          category: MATCH_SOURCE_TYPE,
          title,
          body,
          level: result.status === "matched" ? "success" : "info",
          source_type: MATCH_SOURCE_TYPE,
          source_id: result.id,
          email_status: wantsEmail ? "pending" : "not_needed",
        })
        .select("id")
        .single();

    if (notificationInsertError) {
      throw notificationInsertError;
    }

    if (!wantsEmail) {
      continue;
    }

    const authResult = await admin.auth.admin.getUserById(result.user_id);
    const email = authResult.data.user?.email ?? null;

    if (!email) {
      await admin
        .from("notifications")
        .update({ email_status: "failed" })
        .eq("id", insertedNotification.id);
      continue;
    }

    const emailResult = await sendTransactionalEmail({
      to: email,
      subject: title,
      text: body,
    });

    await admin
      .from("notifications")
      .update({
        email_status: emailResult.ok ? "sent" : "failed",
        emailed_at: emailResult.ok ? nowIso : null,
      })
      .eq("id", insertedNotification.id);
  }

  const { error: batchUpdateError } = await admin
    .from("match_batches")
    .update({
      status: "published",
      published_at: nowIso,
    })
    .eq("id", batchId);

  if (batchUpdateError) {
    throw batchUpdateError;
  }

  await admin.from("operation_logs").insert({
    actor_role: SYSTEM_ACTOR_ROLE,
    action_type: "batch_published",
    entity_type: "match_batch",
    entity_id: batchId,
    payload_json: {
      published_at: nowIso,
    },
  });
}

export async function runBatchLifecycle() {
  const admin = createAdminSupabaseClient();
  const nowIso = new Date().toISOString();

  const lockedBatchIds = await lockExpiredOpenBatches(nowIso);

  const { data: batchesToProcess, error: batchesToProcessError } = await admin
    .from("match_batches")
    .select("id, questionnaire_version_id")
    .in("status", ["locked", "processing"])
    .is("processed_at", null)
    .lte("match_run_at", nowIso);

  if (batchesToProcessError) {
    throw batchesToProcessError;
  }

  const processedBatchIds: string[] = [];
  for (const batch of batchesToProcess ?? []) {
    await processBatch(batch);
    processedBatchIds.push(batch.id);
  }

  const { data: batchesToPublish, error: batchesToPublishError } = await admin
    .from("match_batches")
    .select("id")
    .eq("status", "processing")
    .not("processed_at", "is", null)
    .lte("result_publish_at", nowIso);

  if (batchesToPublishError) {
    throw batchesToPublishError;
  }

  const publishedBatchIds: string[] = [];
  for (const batch of batchesToPublish ?? []) {
    await publishBatch(batch.id);
    publishedBatchIds.push(batch.id);
  }

  return {
    lockedBatchIds,
    processedBatchIds,
    publishedBatchIds,
  } satisfies BatchRunSummary;
}
