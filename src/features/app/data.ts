import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  type CounterpartSnapshot,
  isProfileCompleted,
  isQuestionnaireCompletedStatus,
  parseCounterpartSnapshot,
} from "@/features/app/profile-contract";
import {
  type QuestionnaireWindowStatus,
  getEffectiveQuestionnaireContext,
  getQuestionnaireStateStatus,
} from "@/features/app/questionnaire-runtime";
import {
  getQuestionnaireParticipationRequirement,
  getQuestionnaireStatusHint,
  getQuestionnaireStatusLabel,
} from "@/lib/site";

export type QuestionOption = {
  id: string;
  label: string;
};

export type QuestionnaireQuestion = {
  id: string;
  questionCode: string;
  kind: "single" | "multiple" | "scale";
  prompt: string;
  helperText: string | null;
  placeholder: string | null;
  isRequired: boolean;
  options: QuestionOption[];
  scaleMin: number | null;
  scaleMax: number | null;
  scaleLeftLabel: string | null;
  scaleRightLabel: string | null;
  sortOrder: number;
  weight: number;
};

export type QuestionnaireSection = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  description: string;
  sortOrder: number;
  questions: QuestionnaireQuestion[];
};

export type QuestionnaireState = {
  activeBatchId: string | null;
  activeBatchStatus: string | null;
  versionId: string;
  versionNo: number;
  title: string;
  description: string;
  draftSubmissionId: string | null;
  resultPublishAt: string | null;
  submittedSubmissionId: string | null;
  signupEndAt: string | null;
  status: "not_started" | "draft" | "submitted" | "updated";
  answers: Record<string, string | string[] | number>;
  sections: QuestionnaireSection[];
  source: "batch" | "published";
  windowStatus: QuestionnaireWindowStatus;
};

export type DashboardData = {
  profileCompleted: boolean;
  questionnaireStatusHint: string;
  questionnaireStatusLabel: string;
  questionnaireStatus: QuestionnaireState["status"];
  questionnaireWindowStatus: QuestionnaireWindowStatus;
  hasJoinedCurrentBatch: boolean;
  currentRoundStatus: "not_joined" | "waiting_result" | "result_published";
  currentBatchLabel: string | null;
  currentBatchDeadline: string | null;
  currentBatchResultPublishedAt: string | null;
};

export type ParticipationState = {
  batchId: string | null;
  label: string | null;
  resultPublishAt: string | null;
  signupEndAt: string | null;
  matchRunAt: string | null;
  status: "not_joined" | "joined" | "locked" | "unavailable";
  reason: string | null;
};

export type MatchRecord = {
  id: string;
  batchLabel: string;
  status: "pending" | "matched" | "unmatched" | "error" | "expired";
  previewText: string | null;
  score: number | null;
  viewedAt: string | null;
  releasedAt: string | null;
};

export type MatchDetail = MatchRecord & {
  reasons: string[];
  sharedSignals: string[];
  counterpartSnapshot: CounterpartSnapshot | null;
  contactStatus: "idle" | "confirming" | "triggered" | "failed" | "completed" | null;
  contactInfo: { nickname: string; email: string } | null;
  matchPairId: string | null;
};

export type NotificationItem = {
  id: string;
  title: string;
  body: string;
  level: "info" | "success" | "warning";
  isRead: boolean;
  createdAt: string;
};

export type AnnouncementItem = {
  id: string;
  eyebrow: string;
  title: string;
  body: string;
};

export type ProfileData = {
  id: string;
  nickname: string;
  gender: string;
  grade: string;
  department: string;
  campus: string;
  birthYear: number | null;
  accountStatus: "active" | "restricted" | "deleted";
};

export type SettingsData = {
  notifyMatchResult: boolean;
  notifyWeeklyReminder: boolean;
  notifyPlatformDigest: boolean;
};

function mapQuestionOptionList(raw: unknown): QuestionOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.flatMap((item) => {
    if (
      typeof item === "object" &&
      item !== null &&
      "id" in item &&
      "label" in item &&
      typeof item.id === "string" &&
      typeof item.label === "string"
    ) {
      return [{ id: item.id, label: item.label }];
    }

    return [];
  });
}

function mapAnswers(raw: unknown): Record<string, string | string[] | number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(raw).filter((entry): entry is [string, string | string[] | number] => {
      const value = entry[1];
      return (
        typeof value === "string" ||
        typeof value === "number" ||
        (Array.isArray(value) && value.every((item) => typeof item === "string"))
      );
    }),
  );
}

function parseContactInfo(
  payload: unknown,
  currentUserId: string,
): { nickname: string; email: string } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const record = payload as Record<string, unknown>;
  const left = record.left_user;
  const right = record.right_user;

  if (
    !left ||
    typeof left !== "object" ||
    Array.isArray(left) ||
    !right ||
    typeof right !== "object" ||
    Array.isArray(right)
  ) {
    return null;
  }

  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const counterpart =
    leftRecord.user_id === currentUserId ? rightRecord : leftRecord;

  if (
    typeof counterpart.nickname !== "string" ||
    typeof counterpart.email !== "string"
  ) {
    return null;
  }

  return {
    nickname: counterpart.nickname,
    email: counterpart.email,
  };
}

export async function getAnnouncements() {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, eyebrow, title, body, audience")
    .eq("status", "published")
    .in("audience", ["all", "public", "user"])
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("starts_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    body: item.body,
    eyebrow: item.eyebrow,
    id: item.id,
    title: item.title,
  })) satisfies AnnouncementItem[];
}

export async function getCurrentProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_users")
    .select("id, nickname, gender, grade, department, campus, birth_year, account_status")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    nickname: data.nickname ?? "",
    gender: data.gender ?? "",
    grade: data.grade ?? "",
    department: data.department ?? "",
    campus: data.campus ?? "",
    birthYear: data.birth_year,
    accountStatus: data.account_status,
  } satisfies ProfileData;
}

export async function getSettings(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_users")
    .select(
      "notify_match_result, notify_weekly_reminder, notify_platform_digest",
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    notifyMatchResult: data.notify_match_result,
    notifyWeeklyReminder: data.notify_weekly_reminder,
    notifyPlatformDigest: data.notify_platform_digest,
  } satisfies SettingsData;
}

export async function getQuestionnaireState(userId: string) {
  const supabase = await createServerSupabaseClient();
  const context = await getEffectiveQuestionnaireContext(supabase);

  if (!context) {
    throw new Error("当前没有可用的问卷版本。");
  }

  const [sectionsResult, questionsResult, submissionsResult] = await Promise.all([
    supabase
      .from("questionnaire_sections")
      .select("id, code, title, subtitle, description, sort_order")
      .eq("questionnaire_version_id", context.versionId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("questionnaire_questions")
      .select(
        "id, section_id, question_code, kind, prompt, helper_text, placeholder, is_required, options_json, scale_min, scale_max, scale_left_label, scale_right_label, sort_order, weight",
      )
      .eq("questionnaire_version_id", context.versionId)
      .order("sort_order", { ascending: true }),
    supabase
      .from("questionnaire_submissions")
      .select("id, status, answers_json, submission_no")
      .eq("user_id", userId)
      .eq("questionnaire_version_id", context.versionId)
      .order("submission_no", { ascending: false }),
  ]);

  if (sectionsResult.error) {
    throw sectionsResult.error;
  }

  if (questionsResult.error) {
    throw questionsResult.error;
  }

  if (submissionsResult.error) {
    throw submissionsResult.error;
  }

  const sections = (sectionsResult.data ?? []).map((section) => ({
    id: section.id,
    code: section.code,
    title: section.title,
    subtitle: section.subtitle,
    description: section.description,
    sortOrder: section.sort_order,
    questions: (questionsResult.data ?? [])
      .filter((question) => question.section_id === section.id)
      .map((question) => ({
        id: question.id,
        questionCode: question.question_code,
        kind: question.kind,
        prompt: question.prompt,
        helperText: question.helper_text,
        placeholder: question.placeholder,
        isRequired: question.is_required,
        options: mapQuestionOptionList(question.options_json),
        scaleMin: question.scale_min,
        scaleMax: question.scale_max,
        scaleLeftLabel: question.scale_left_label,
        scaleRightLabel: question.scale_right_label,
        sortOrder: question.sort_order,
        weight: question.weight,
      })),
  })) satisfies QuestionnaireSection[];

  const submissions = submissionsResult.data ?? [];
  const draft = submissions.find((submission) => submission.status === "draft");
  const submitted = submissions.find((submission) => submission.status === "submitted");
  const latest = draft ?? submitted ?? null;

  return {
    activeBatchId: context.batchId,
    activeBatchStatus: context.batchStatus,
    versionId: context.versionId,
    versionNo: context.versionNo,
    title: context.title,
    description: context.description,
    draftSubmissionId: draft?.id ?? null,
    submittedSubmissionId: submitted?.id ?? null,
    resultPublishAt: context.resultPublishAt,
    signupEndAt: context.signupEndAt,
    status: getQuestionnaireStateStatus({
      hasDraft: Boolean(draft),
      hasSubmitted: Boolean(submitted),
    }),
    answers: mapAnswers(latest?.answers_json),
    sections,
    source: context.source,
    windowStatus: context.windowStatus,
  } satisfies QuestionnaireState;
}

export async function getParticipationState(userId: string) {
  const supabase = await createServerSupabaseClient();
  const questionnaireContext = await getEffectiveQuestionnaireContext(supabase);

  if (!questionnaireContext?.batchId || questionnaireContext.windowStatus === "closed") {
    if (questionnaireContext?.batchId) {
      const { data: currentBatch, error: currentBatchError } = await supabase
        .from("match_batches")
        .select("id, label, signup_end_at, match_run_at, result_publish_at")
        .eq("id", questionnaireContext.batchId)
        .single();

      if (currentBatchError) {
        throw currentBatchError;
      }

      return {
        batchId: currentBatch.id,
        label: currentBatch.label,
        resultPublishAt: currentBatch.result_publish_at,
        signupEndAt: currentBatch.signup_end_at,
        matchRunAt: currentBatch.match_run_at,
        status: "unavailable",
        reason: "当前轮报名已截止，结果公布前暂不开放新的参与。",
      } satisfies ParticipationState;
    }

    return {
      batchId: null,
      label: null,
      resultPublishAt: null,
      signupEndAt: null,
      matchRunAt: null,
      status: "unavailable",
      reason: "当前没有开放中的匹配批次。",
    } satisfies ParticipationState;
  }

  const { data: batch, error: batchError } = await supabase
    .from("match_batches")
    .select("id, label, signup_end_at, match_run_at, result_publish_at, status")
    .eq("id", questionnaireContext.batchId)
    .single();

  if (batchError) {
    throw batchError;
  }

  const profile = await getCurrentProfile(userId);
  if (!isProfileCompleted(profile)) {
    return {
      batchId: batch.id,
      label: batch.label,
      resultPublishAt: batch.result_publish_at,
      signupEndAt: batch.signup_end_at,
      matchRunAt: batch.match_run_at,
      status: "unavailable",
      reason: "基础资料未完善，暂时不能报名本周匹配。",
    } satisfies ParticipationState;
  }

  const questionnaire = await getQuestionnaireState(userId);
  if (
    questionnaire.windowStatus !== "open" ||
    !isQuestionnaireCompletedStatus(questionnaire.status)
  ) {
    return {
      batchId: batch.id,
      label: batch.label,
      resultPublishAt: batch.result_publish_at,
      signupEndAt: batch.signup_end_at,
      matchRunAt: batch.match_run_at,
      status: "unavailable",
      reason: getQuestionnaireParticipationRequirement({
        status: questionnaire.status,
        windowStatus: questionnaire.windowStatus,
      }),
    } satisfies ParticipationState;
  }

  const { data: participation, error: participationError } = await supabase
    .from("batch_participations")
    .select("id, status")
    .eq("batch_id", batch.id)
    .eq("user_id", userId)
    .maybeSingle();

  if (participationError) {
    throw participationError;
  }

  if (!participation) {
    return {
      batchId: batch.id,
      label: batch.label,
      resultPublishAt: batch.result_publish_at,
      signupEndAt: batch.signup_end_at,
      matchRunAt: batch.match_run_at,
      status: "not_joined",
      reason: null,
    } satisfies ParticipationState;
  }

  if (participation.status === "cancelled") {
    return {
      batchId: batch.id,
      label: batch.label,
      resultPublishAt: batch.result_publish_at,
      signupEndAt: batch.signup_end_at,
      matchRunAt: batch.match_run_at,
      status: "not_joined",
      reason: null,
    } satisfies ParticipationState;
  }

  return {
    batchId: batch.id,
    label: batch.label,
    resultPublishAt: batch.result_publish_at,
    signupEndAt: batch.signup_end_at,
    matchRunAt: batch.match_run_at,
    status: participation.status === "locked" ? "locked" : "joined",
    reason: null,
  } satisfies ParticipationState;
}

export async function getNotifications(userId: string) {
  const supabase = await createServerSupabaseClient();
  const pageSize = 24;
  const visibleNotifications: NotificationItem[] = [];

  for (let page = 0; visibleNotifications.length < 8; page += 1) {
    const rangeFrom = page * pageSize;
    const rangeTo = rangeFrom + pageSize - 1;
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, body, level, is_read, created_at, source_type, source_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(rangeFrom, rangeTo);

    if (error) {
      throw error;
    }

    const currentPage = data ?? [];
    if (currentPage.length === 0) {
      break;
    }

    const matchResultSourceIds = [
      ...new Set(
        currentPage
          .filter(
            (item): item is typeof item & { source_id: string } =>
              item.source_type === "match_result" &&
              typeof item.source_id === "string",
          )
          .map((item) => item.source_id),
      ),
    ];
    const releasedResultIds = new Set<string>();

    if (matchResultSourceIds.length > 0) {
      const { data: releasedResults, error: releasedResultsError } = await supabase
        .from("match_results")
        .select("id")
        .eq("user_id", userId)
        .in("id", matchResultSourceIds)
        .not("released_at", "is", null);

      if (releasedResultsError) {
        throw releasedResultsError;
      }

      for (const result of releasedResults ?? []) {
        releasedResultIds.add(result.id);
      }
    }

    visibleNotifications.push(
      ...currentPage
        .filter(
          (item) =>
            item.source_type !== "match_result" ||
            (typeof item.source_id === "string" &&
              releasedResultIds.has(item.source_id)),
        )
        .map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
          level: item.level,
          isRead: item.is_read,
          createdAt: item.created_at,
        })),
    );

    if (currentPage.length < pageSize) {
      break;
    }
  }

  return visibleNotifications.slice(0, 8);
}

export async function getMatchRecords(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: results, error: resultsError } = await supabase
    .from("match_results")
    .select("id, batch_id, status, preview_text, score, viewed_at, released_at")
    .eq("user_id", userId)
    .not("released_at", "is", null)
    .order("created_at", { ascending: false });

  if (resultsError) {
    throw resultsError;
  }

  if (!results?.length) {
    return [] as MatchRecord[];
  }

  const batchIds = [...new Set(results.map((item) => item.batch_id))];
  const { data: batches, error: batchesError } = await supabase
    .from("match_batches")
    .select("id, label, status")
    .in("id", batchIds);

  if (batchesError) {
    throw batchesError;
  }

  const labelMap = new Map(
    (batches ?? [])
      .filter((batch) => batch.status === "published")
      .map((batch) => [batch.id, batch.label]),
  );

  const visibleResults = results.filter((item) => labelMap.has(item.batch_id));

  return visibleResults.map((item) => ({
    id: item.id,
    batchLabel: labelMap.get(item.batch_id) ?? "未命名批次",
    status: item.status,
    previewText: item.preview_text,
    score: item.score,
    viewedAt: item.viewed_at,
    releasedAt: item.released_at,
  })) satisfies MatchRecord[];
}

export async function getMatchDetail(userId: string, matchId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: record, error } = await supabase
    .from("match_results")
    .select(
      "id, batch_id, match_pair_id, status, preview_text, score, viewed_at, released_at, reasons, shared_signals, counterpart_snapshot_json",
    )
    .eq("id", matchId)
    .eq("user_id", userId)
    .not("released_at", "is", null)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!record) {
    return null;
  }

  const { data: batch, error: batchError } = await supabase
    .from("match_batches")
    .select("label, status")
    .eq("id", record.batch_id)
    .single();

  if (batchError) {
    throw batchError;
  }

  if (batch.status !== "published") {
    return null;
  }

  let contactStatus: MatchDetail["contactStatus"] = null;
  let contactInfo: MatchDetail["contactInfo"] = null;

  if (record.match_pair_id) {
    const { data: pair, error: pairError } = await supabase
      .from("match_pairs")
      .select("contact_status, contact_payload_json")
      .eq("id", record.match_pair_id)
      .maybeSingle();

    if (pairError) {
      throw pairError;
    }

    contactStatus = pair?.contact_status ?? null;
    contactInfo = parseContactInfo(pair?.contact_payload_json ?? null, userId);
  }

  return {
    id: record.id,
    batchLabel: batch.label,
    status: record.status,
    previewText: record.preview_text,
    score: record.score,
    viewedAt: record.viewed_at,
    releasedAt: record.released_at,
    reasons: record.reasons ?? [],
    sharedSignals: record.shared_signals ?? [],
    counterpartSnapshot: parseCounterpartSnapshot(record.counterpart_snapshot_json),
    contactStatus,
    contactInfo,
    matchPairId: record.match_pair_id,
  } satisfies MatchDetail;
}

export async function getDashboardData(userId: string) {
  const supabase = await createServerSupabaseClient();
  const [profile, questionnaire] = await Promise.all([
    getCurrentProfile(userId),
    getQuestionnaireState(userId),
  ]);
  const activeBatchId = questionnaire.activeBatchId;
  const currentBatch = activeBatchId
    ? await (async () => {
        const { data, error } = await supabase
          .from("match_batches")
          .select("id, label, signup_end_at, result_publish_at, status")
          .eq("id", activeBatchId)
          .maybeSingle();

        if (error) {
          throw error;
        }

        return data;
      })()
    : null;
  let hasJoinedCurrentBatch = false;
  let currentRoundStatus: DashboardData["currentRoundStatus"] = "not_joined";

  if (currentBatch) {
    const [participationResult, matchResult] = await Promise.all([
      supabase
        .from("batch_participations")
        .select("status")
        .eq("batch_id", currentBatch.id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("match_results")
        .select("released_at")
        .eq("batch_id", currentBatch.id)
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    if (participationResult.error) {
      throw participationResult.error;
    }

    if (matchResult.error) {
      throw matchResult.error;
    }

    hasJoinedCurrentBatch =
      participationResult.data?.status === "joined" ||
      participationResult.data?.status === "locked";

    if (hasJoinedCurrentBatch) {
      currentRoundStatus =
        currentBatch.status === "published" && Boolean(matchResult.data?.released_at)
          ? "result_published"
          : "waiting_result";
    }
  }

  return {
    profileCompleted: isProfileCompleted(profile),
    questionnaireStatusHint: getQuestionnaireStatusHint({
      resultPublishAt: questionnaire.resultPublishAt,
      signupEndAt: questionnaire.signupEndAt,
      status: questionnaire.status,
      windowStatus: questionnaire.windowStatus,
    }),
    questionnaireStatusLabel: getQuestionnaireStatusLabel({
      resultPublishAt: questionnaire.resultPublishAt,
      signupEndAt: questionnaire.signupEndAt,
      status: questionnaire.status,
      windowStatus: questionnaire.windowStatus,
    }),
    questionnaireStatus: questionnaire.status,
    questionnaireWindowStatus: questionnaire.windowStatus,
    hasJoinedCurrentBatch,
    currentRoundStatus,
    currentBatchLabel: currentBatch?.label ?? null,
    currentBatchDeadline: currentBatch?.signup_end_at ?? null,
    currentBatchResultPublishedAt: currentBatch?.result_publish_at ?? null,
  } satisfies DashboardData;
}
