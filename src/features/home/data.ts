import "server-only";

import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type HomePageMetrics = {
  currentBatchParticipants: number;
  registeredUsers: number;
  newUsersLast30Days: number;
  questionnaireCompletionRate: number;
  questionnaireCompletedUsers: number;
  matchedUsers: number;
};

export type HomePageData = HomePageMetrics & {
  signedIn: boolean;
  primaryHref: string;
  primaryLabel: string;
  currentBatchLabel: string | null;
  signupDeadlineLabel: string;
  countdownTargetAt: string | null;
  nextMatchTimeLabel: string;
  matchScheduleText: string;
};

const DEFAULT_MATCH_SCHEDULE_TEXT = "每周三 20:00 统一公布结果。";

const chineseDateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function getDateTimePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

function formatChineseDateTime(value: string | null | undefined) {
  if (!value) {
    return "待定";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "待定";
  }

  const parts = chineseDateTimeFormatter.formatToParts(date);
  const year = getDateTimePart(parts, "year");
  const month = getDateTimePart(parts, "month");
  const day = getDateTimePart(parts, "day");
  const weekday = getDateTimePart(parts, "weekday");
  const hour = getDateTimePart(parts, "hour");
  const minute = getDateTimePart(parts, "minute");

  return `${year}年${month}月${day}日 ${weekday} ${hour}:${minute}`;
}

function getDistinctUserCount(rows: Array<{ user_id: string }>) {
  return new Set(rows.map((row) => row.user_id)).size;
}

export async function getHomePageData(signedIn: boolean) {
  const supabase = createAdminSupabaseClient();
  const last30Days = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000,
  ).toISOString();

  const [
    currentBatchResult,
    publishedVersionResult,
    matchScheduleConfigResult,
    registeredUsersResult,
    newUsersResult,
    matchedUsersResult,
  ] = await Promise.all([
    supabase
      .from("match_batches")
      .select(
        "id, label, questionnaire_version_id, signup_end_at, match_run_at, result_publish_at",
      )
      .eq("status", "open")
      .order("signup_start_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("questionnaire_versions")
      .select("id")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("app_configs")
      .select("value_json")
      .eq("config_key", "match_schedule_text")
      .maybeSingle(),
    supabase
      .from("app_users")
      .select("id", { count: "exact", head: true })
      .neq("account_status", "deleted"),
    supabase
      .from("app_users")
      .select("id", { count: "exact", head: true })
      .neq("account_status", "deleted")
      .gte("created_at", last30Days),
    supabase
      .from("match_results")
      .select("user_id")
      .eq("status", "matched")
      .not("released_at", "is", null),
  ]);

  if (currentBatchResult.error) {
    throw currentBatchResult.error;
  }

  if (publishedVersionResult.error) {
    throw publishedVersionResult.error;
  }

  if (matchScheduleConfigResult.error) {
    throw matchScheduleConfigResult.error;
  }

  if (registeredUsersResult.error) {
    throw registeredUsersResult.error;
  }

  if (newUsersResult.error) {
    throw newUsersResult.error;
  }

  if (matchedUsersResult.error) {
    throw matchedUsersResult.error;
  }

  const currentBatch = currentBatchResult.data;
  const publishedVersionId =
    currentBatch?.questionnaire_version_id ?? publishedVersionResult.data?.id ?? null;

  const [participantsResult, questionnaireSubmissionsResult] = await Promise.all([
    currentBatch
      ? supabase
          .from("batch_participations")
          .select("id", { count: "exact", head: true })
          .eq("batch_id", currentBatch.id)
          .in("status", ["joined", "locked"])
      : Promise.resolve({ data: null, count: 0, error: null }),
    publishedVersionId
      ? supabase
          .from("questionnaire_submissions")
          .select("user_id")
          .eq("questionnaire_version_id", publishedVersionId)
          .eq("status", "submitted")
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (participantsResult.error) {
    throw participantsResult.error;
  }

  if (questionnaireSubmissionsResult.error) {
    throw questionnaireSubmissionsResult.error;
  }

  const registeredUsers = registeredUsersResult.count ?? 0;
  const questionnaireCompletedUsers = getDistinctUserCount(
    questionnaireSubmissionsResult.data ?? [],
  );
  const matchedUsers = getDistinctUserCount(matchedUsersResult.data ?? []);
  const questionnaireCompletionRate =
    registeredUsers > 0
      ? Math.round((questionnaireCompletedUsers / registeredUsers) * 100)
      : 0;
  const countdownTargetAt =
    currentBatch?.result_publish_at ?? currentBatch?.match_run_at ?? null;

  return {
    signedIn,
    primaryHref: signedIn ? "/app" : "/login",
    primaryLabel: signedIn ? "进入站内" : "立即开始",
    currentBatchParticipants: participantsResult.count ?? 0,
    currentBatchLabel: currentBatch?.label ?? null,
    signupDeadlineLabel: formatChineseDateTime(currentBatch?.signup_end_at ?? null),
    countdownTargetAt,
    nextMatchTimeLabel: formatChineseDateTime(countdownTargetAt),
    matchScheduleText:
      typeof matchScheduleConfigResult.data?.value_json === "string"
        ? matchScheduleConfigResult.data.value_json
        : DEFAULT_MATCH_SCHEDULE_TEXT,
    registeredUsers,
    newUsersLast30Days: newUsersResult.count ?? 0,
    questionnaireCompletionRate,
    questionnaireCompletedUsers,
    matchedUsers,
  } satisfies HomePageData;
}
