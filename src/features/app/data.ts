import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type QuestionOption = {
  id: string;
  label: string;
};

export type QuestionnaireQuestion = {
  id: string;
  questionCode: string;
  kind: "text" | "single" | "multiple" | "scale";
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
  versionId: string;
  versionNo: number;
  title: string;
  description: string;
  draftSubmissionId: string | null;
  submittedSubmissionId: string | null;
  status: "not_started" | "draft" | "submitted" | "updated";
  answers: Record<string, string | string[] | number>;
  sections: QuestionnaireSection[];
};

export type DashboardData = {
  profileCompleted: boolean;
  questionnaireStatus: QuestionnaireState["status"];
  hasJoinedCurrentBatch: boolean;
  currentBatchLabel: string | null;
  currentBatchDeadline: string | null;
  latestMatchStatus: string | null;
  unreadNotificationCount: number;
};

export type ParticipationState = {
  batchId: string | null;
  label: string | null;
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
  counterpartSnapshot: Record<string, unknown> | null;
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
  department: string;
  major: string;
  grade: string;
  gender: string;
  targetPreference: string;
  bio: string;
  interests: string[];
  showNickname: boolean;
  accountStatus: "active" | "restricted" | "delete_requested" | "deleted";
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

function isProfileCompleted(profile: ProfileData) {
  return Boolean(
    profile.nickname &&
      profile.department &&
      profile.major &&
      profile.grade &&
      profile.gender &&
      profile.targetPreference,
  );
}

export async function getAnnouncements() {
  const supabase = await createServerSupabaseClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("announcements")
    .select("id, eyebrow, title, body")
    .eq("status", "published")
    .lte("starts_at", now)
    .gte("ends_at", now)
    .order("starts_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as AnnouncementItem[];
}

export async function getCurrentProfile(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("app_users")
    .select(
      "id, nickname, department, major, grade, gender, target_preference, bio, interests, show_nickname, account_status",
    )
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return {
    id: data.id,
    nickname: data.nickname ?? "",
    department: data.department ?? "",
    major: data.major ?? "",
    grade: data.grade ?? "",
    gender: data.gender ?? "",
    targetPreference: data.target_preference ?? "",
    bio: data.bio ?? "",
    interests: data.interests ?? [],
    showNickname: data.show_nickname,
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
  const { data: version, error: versionError } = await supabase
    .from("questionnaire_versions")
    .select("id, version_no, title, description")
    .eq("status", "published")
    .single();

  if (versionError) {
    throw versionError;
  }

  const [sectionsResult, questionsResult, submissionsResult] = await Promise.all([
    supabase
      .from("questionnaire_sections")
      .select("id, code, title, subtitle, description, sort_order")
      .eq("questionnaire_version_id", version.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("questionnaire_questions")
      .select(
        "id, section_id, question_code, kind, prompt, helper_text, placeholder, is_required, options_json, scale_min, scale_max, scale_left_label, scale_right_label, sort_order",
      )
      .eq("questionnaire_version_id", version.id)
      .order("sort_order", { ascending: true }),
    supabase
      .from("questionnaire_submissions")
      .select("id, status, answers_json, submission_no")
      .eq("user_id", userId)
      .eq("questionnaire_version_id", version.id)
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
      })),
  })) satisfies QuestionnaireSection[];

  const submissions = submissionsResult.data ?? [];
  const draft = submissions.find((submission) => submission.status === "draft");
  const submitted = submissions.find((submission) => submission.status === "submitted");
  const latest = draft ?? submitted ?? null;

  return {
    versionId: version.id,
    versionNo: version.version_no,
    title: version.title,
    description: version.description,
    draftSubmissionId: draft?.id ?? null,
    submittedSubmissionId: submitted?.id ?? null,
    status:
      draft && submitted
        ? "updated"
        : draft
          ? "draft"
          : submitted
            ? "submitted"
            : "not_started",
    answers: mapAnswers(latest?.answers_json),
    sections,
  } satisfies QuestionnaireState;
}

export async function getParticipationState(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: batch, error: batchError } = await supabase
    .from("match_batches")
    .select("id, label, signup_end_at, match_run_at, status")
    .eq("status", "open")
    .order("signup_end_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (batchError) {
    throw batchError;
  }

  if (!batch) {
    return {
      batchId: null,
      label: null,
      signupEndAt: null,
      matchRunAt: null,
      status: "unavailable",
      reason: "当前没有开放中的匹配批次。",
    } satisfies ParticipationState;
  }

  const profile = await getCurrentProfile(userId);
  if (!isProfileCompleted(profile)) {
    return {
      batchId: batch.id,
      label: batch.label,
      signupEndAt: batch.signup_end_at,
      matchRunAt: batch.match_run_at,
      status: "unavailable",
      reason: "基础资料未完善，暂时不能报名本周匹配。",
    } satisfies ParticipationState;
  }

  const questionnaire = await getQuestionnaireState(userId);
  if (!["submitted", "updated"].includes(questionnaire.status)) {
    return {
      batchId: batch.id,
      label: batch.label,
      signupEndAt: batch.signup_end_at,
      matchRunAt: batch.match_run_at,
      status: "unavailable",
      reason: "请先正式提交当前问卷，再加入本周匹配。",
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
      signupEndAt: batch.signup_end_at,
      matchRunAt: batch.match_run_at,
      status: "not_joined",
      reason: null,
    } satisfies ParticipationState;
  }

  return {
    batchId: batch.id,
    label: batch.label,
    signupEndAt: batch.signup_end_at,
    matchRunAt: batch.match_run_at,
    status: participation.status === "locked" ? "locked" : "joined",
    reason: null,
  } satisfies ParticipationState;
}

export async function getNotifications(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, body, level, is_read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    throw error;
  }

  return (data ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    level: item.level,
    isRead: item.is_read,
    createdAt: item.created_at,
  })) satisfies NotificationItem[];
}

export async function getMatchRecords(userId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: results, error: resultsError } = await supabase
    .from("match_results")
    .select("id, batch_id, status, preview_text, score, viewed_at, released_at")
    .eq("user_id", userId)
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
    .select("id, label")
    .in("id", batchIds);

  if (batchesError) {
    throw batchesError;
  }

  const labelMap = new Map((batches ?? []).map((batch) => [batch.id, batch.label]));

  return results.map((item) => ({
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
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!record) {
    return null;
  }

  const { data: batch, error: batchError } = await supabase
    .from("match_batches")
    .select("label")
    .eq("id", record.batch_id)
    .single();

  if (batchError) {
    throw batchError;
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
    counterpartSnapshot:
      record.counterpart_snapshot_json &&
      typeof record.counterpart_snapshot_json === "object" &&
      !Array.isArray(record.counterpart_snapshot_json)
        ? (record.counterpart_snapshot_json as Record<string, unknown>)
        : null,
    contactStatus,
    contactInfo,
    matchPairId: record.match_pair_id,
  } satisfies MatchDetail;
}

export async function getDashboardData(userId: string) {
  const [profile, questionnaire, participation, notifications, records] =
    await Promise.all([
      getCurrentProfile(userId),
      getQuestionnaireState(userId),
      getParticipationState(userId),
      getNotifications(userId),
      getMatchRecords(userId),
    ]);

  return {
    profileCompleted: isProfileCompleted(profile),
    questionnaireStatus: questionnaire.status,
    hasJoinedCurrentBatch:
      participation.status === "joined" || participation.status === "locked",
    currentBatchLabel: participation.label,
    currentBatchDeadline: participation.signupEndAt,
    latestMatchStatus: records[0]?.status ?? null,
    unreadNotificationCount: notifications.filter((item) => !item.isRead).length,
  } satisfies DashboardData;
}
