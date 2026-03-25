import "server-only";

import { getEffectiveQuestionnaireContext } from "@/features/app/questionnaire-runtime";
import { countActiveSubmittedQuestionnaireUsers } from "@/lib/questionnaire-metrics";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export type AdminDashboardData = {
  currentBatch: {
    id: string | null;
    label: string | null;
    matchRunAt: string | null;
    resultPublishAt: string | null;
    signupEndAt: string | null;
    signupStartAt: string | null;
    status: string | null;
  };
  currentQuestionnaire: {
    completionCount: number;
    completionRate: number;
    versionId: string | null;
    versionNo: number | null;
  };
  lastPublishedBatch: {
    id: string | null;
    label: string | null;
    matchedCount: number;
    unmatchedCount: number;
  };
  latestAnnouncement: {
    id: string;
    status: string;
    title: string;
  } | null;
  recentOperationLogs: Array<{
    actionType: string;
    actorRole: string;
    createdAt: string;
    entityId: string | null;
    entityType: string;
    id: string;
  }>;
  runStatus: {
    actionType: string | null;
    actedAt: string | null;
    batchId: string | null;
    label: string | null;
    lastErrorMessage: string | null;
    source: string | null;
    status: string | null;
  };
  users: {
    createdInLast30Days: number;
    total: number;
  };
};

async function countActiveUsers() {
  const admin = createAdminSupabaseClient();
  const thirtyDaysAgoDate = new Date();
  thirtyDaysAgoDate.setDate(thirtyDaysAgoDate.getDate() - 30);
  const thirtyDaysAgo = thirtyDaysAgoDate.toISOString();

  const [totalResult, createdRecentlyResult] = await Promise.all([
    admin
      .from("app_users")
      .select("*", {
        count: "exact",
        head: true,
      })
      .neq("account_status", "deleted"),
    admin
      .from("app_users")
      .select("*", {
        count: "exact",
        head: true,
      })
      .neq("account_status", "deleted")
      .gte("created_at", thirtyDaysAgo),
  ]);

  if (totalResult.error) {
    throw totalResult.error;
  }

  if (createdRecentlyResult.error) {
    throw createdRecentlyResult.error;
  }

  return {
    createdInLast30Days: createdRecentlyResult.count ?? 0,
    total: totalResult.count ?? 0,
  };
}

export async function getAdminDashboardData() {
  const admin = createAdminSupabaseClient();
  const [
    users,
    questionnaireContext,
    currentBatchResult,
    latestPublishedBatchResult,
    latestAnnouncementResult,
    recentOperationLogsResult,
    latestRunLogResult,
    runStatusBatchResult,
  ] = await Promise.all([
    countActiveUsers(),
    getEffectiveQuestionnaireContext(admin),
    admin
      .from("match_batches")
      .select(
        "id, label, signup_start_at, signup_end_at, match_run_at, result_publish_at, status",
      )
      .in("status", ["draft", "open", "locked", "processing", "failed"])
      .order("signup_end_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("match_batches")
      .select("id, label")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("announcements")
      .select("id, title, status")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("operation_logs")
      .select("id, actor_role, action_type, entity_type, entity_id, created_at")
      .order("created_at", { ascending: false })
      .limit(6),
    admin
      .from("operation_logs")
      .select("action_type, actor_role, created_at, entity_id")
      .eq("entity_type", "match_batch")
      .in("action_type", ["batch_processed", "batch_process_failed"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("match_batches")
      .select("id, label, status, last_error_message")
      .in("status", ["failed", "processing", "published"])
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (currentBatchResult.error) {
    throw currentBatchResult.error;
  }

  if (latestPublishedBatchResult.error) {
    throw latestPublishedBatchResult.error;
  }

  if (latestAnnouncementResult.error) {
    throw latestAnnouncementResult.error;
  }

  if (recentOperationLogsResult.error) {
    throw recentOperationLogsResult.error;
  }

  if (latestRunLogResult.error) {
    throw latestRunLogResult.error;
  }

  if (runStatusBatchResult.error) {
    throw runStatusBatchResult.error;
  }

  const runStatusBatch =
    typeof latestRunLogResult.data?.entity_id === "string"
      ? await admin
          .from("match_batches")
          .select("id, label, status, last_error_message")
          .eq("id", latestRunLogResult.data.entity_id)
          .maybeSingle()
      : runStatusBatchResult;

  if (runStatusBatch.error) {
    throw runStatusBatch.error;
  }

  const [questionnaireCompletionCount, publishedBatchResultsResult] =
    await Promise.all([
      countActiveSubmittedQuestionnaireUsers(
        admin,
        questionnaireContext?.versionId ?? null,
      ),
      latestPublishedBatchResult.data
        ? admin
            .from("match_results")
            .select("status")
            .eq("batch_id", latestPublishedBatchResult.data.id)
        : Promise.resolve({ data: [], error: null }),
    ]);

  if (publishedBatchResultsResult.error) {
    throw publishedBatchResultsResult.error;
  }

  const publishedBatchResults = publishedBatchResultsResult.data ?? [];
  const matchedCount = publishedBatchResults.filter(
    (item) => item.status === "matched",
  ).length;
  const unmatchedCount = publishedBatchResults.filter(
    (item) => item.status === "unmatched",
  ).length;
  const completionCount = questionnaireCompletionCount;

  return {
    currentBatch: {
      id: currentBatchResult.data?.id ?? null,
      label: currentBatchResult.data?.label ?? null,
      matchRunAt: currentBatchResult.data?.match_run_at ?? null,
      resultPublishAt: currentBatchResult.data?.result_publish_at ?? null,
      signupEndAt: currentBatchResult.data?.signup_end_at ?? null,
      signupStartAt: currentBatchResult.data?.signup_start_at ?? null,
      status: currentBatchResult.data?.status ?? null,
    },
    currentQuestionnaire: {
      completionCount,
      completionRate:
        users.total > 0 ? Math.round((completionCount / users.total) * 100) : 0,
      versionId: questionnaireContext?.versionId ?? null,
      versionNo: questionnaireContext?.versionNo ?? null,
    },
    lastPublishedBatch: {
      id: latestPublishedBatchResult.data?.id ?? null,
      label: latestPublishedBatchResult.data?.label ?? null,
      matchedCount,
      unmatchedCount,
    },
    latestAnnouncement: latestAnnouncementResult.data
      ? {
          id: latestAnnouncementResult.data.id,
          status: latestAnnouncementResult.data.status,
          title: latestAnnouncementResult.data.title,
        }
      : null,
    recentOperationLogs: (recentOperationLogsResult.data ?? []).map((item) => ({
      actionType: item.action_type,
      actorRole: item.actor_role,
      createdAt: item.created_at,
      entityId: item.entity_id,
      entityType: item.entity_type,
      id: item.id,
    })),
    runStatus: {
      actionType: latestRunLogResult.data?.action_type ?? null,
      actedAt: latestRunLogResult.data?.created_at ?? null,
      batchId:
        (typeof latestRunLogResult.data?.entity_id === "string"
          ? latestRunLogResult.data.entity_id
          : null) ??
        runStatusBatch.data?.id ??
        null,
      label: runStatusBatch.data?.label ?? null,
      lastErrorMessage: runStatusBatch.data?.last_error_message ?? null,
      source: latestRunLogResult.data?.actor_role ?? null,
      status: runStatusBatch.data?.status ?? null,
    },
    users,
  } satisfies AdminDashboardData;
}
