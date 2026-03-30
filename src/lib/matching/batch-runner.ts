import "server-only";

import { sendTransactionalEmail } from "@/lib/email/send";
import {
  openBatch as openBatchCore,
  lockBatch as lockBatchCore,
  processBatch as processBatchCore,
  publishBatch as publishBatchCore,
  rerunFailedBatch as rerunFailedBatchCore,
  resetInterruptedBatch as resetInterruptedBatchCore,
  runBatchAutomationSweep as runBatchAutomationSweepCore,
  type BatchAutomationSweepResult,
  type BatchLifecycleContext,
} from "@/lib/matching/lifecycle-core";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database.generated";

type ActorRole = "admin" | "system";

type ClaimedNotificationRow = {
  body: string;
  notification_id: string;
  title: string;
  user_id: string;
};

type AuthUserLookupRow = {
  banned_until: string | null;
  email: string | null;
  user_id: string;
};

export type MatchResultEmailSyncResult = {
  attemptedCount: number;
  failedCount: number;
  sentCount: number;
};

const CLAIM_LIMIT = 50;
const SEND_CONCURRENCY = 5;
const CLAIM_TIMEOUT_MS = 10 * 60 * 1000;

function createNodeLifecycleContext(input?: {
  actorRole?: ActorRole;
}) {
  return {
    admin: createAdminSupabaseClient(),
    actorRole: input?.actorRole ?? "system",
    createUuid: () => crypto.randomUUID(),
    nowIso: new Date().toISOString(),
  } satisfies BatchLifecycleContext;
}

function getClaimTimeoutCutoff(nowIso: string) {
  return new Date(new Date(nowIso).getTime() - CLAIM_TIMEOUT_MS).toISOString();
}

function chunkItems<T>(items: T[], size: number) {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
}

async function claimPendingMatchResultEmailNotifications(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  reclaimBeforeIso: string,
) {
  const { data, error } = await admin.rpc(
    "claim_pending_match_result_email_notifications" as never,
    {
      p_limit: CLAIM_LIMIT,
      p_reclaim_before: reclaimBeforeIso,
    } as never,
  );

  if (error) {
    throw error;
  }

  return (data ?? []) as ClaimedNotificationRow[];
}

async function getAuthUserEmailMap(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  userIds: string[],
) {
  if (userIds.length === 0) {
    return new Map<string, string | null>();
  }

  const { data, error } = await admin.rpc(
    "get_auth_users_by_ids" as never,
    {
      p_user_ids: userIds,
    } as never,
  );

  if (error) {
    throw error;
  }

  return new Map(
    ((data ?? []) as AuthUserLookupRow[]).map((row) => [row.user_id, row.email]),
  );
}

async function updateNotificationEmailDeliveryState(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  input: {
    emailStatus: Database["public"]["Tables"]["notifications"]["Row"]["email_status"];
    emailedAt: string | null;
    notificationId: string;
  },
) {
  const { error } = await admin
    .from("notifications")
    .update({
      email_claimed_at: null,
      email_status: input.emailStatus,
      emailed_at: input.emailedAt,
    })
    .eq("id", input.notificationId);

  if (error) {
    throw error;
  }
}

async function deliverClaimedNotification(
  admin: ReturnType<typeof createAdminSupabaseClient>,
  input: {
    emailByUserId: Map<string, string | null>;
    notification: ClaimedNotificationRow;
    nowIso: string;
  },
) {
  const email = input.emailByUserId.get(input.notification.user_id) ?? null;

  if (!email) {
    await updateNotificationEmailDeliveryState(admin, {
      emailStatus: "failed",
      emailedAt: null,
      notificationId: input.notification.notification_id,
    });

    return false;
  }

  const emailResult = await sendTransactionalEmail({
    to: email,
    subject: input.notification.title,
    text: input.notification.body,
  });

  await updateNotificationEmailDeliveryState(admin, {
    emailStatus: emailResult.ok ? "sent" : "failed",
    emailedAt: emailResult.ok ? input.nowIso : null,
    notificationId: input.notification.notification_id,
  });

  return emailResult.ok;
}

export async function drainMatchResultEmailQueue(): Promise<MatchResultEmailSyncResult> {
  const context = createNodeLifecycleContext();
  const admin = context.admin;
  const claimedNotifications = await claimPendingMatchResultEmailNotifications(
    admin,
    getClaimTimeoutCutoff(context.nowIso),
  );

  if (claimedNotifications.length === 0) {
    return {
      attemptedCount: 0,
      failedCount: 0,
      sentCount: 0,
    };
  }

  const emailByUserId = await getAuthUserEmailMap(admin, [
    ...new Set(claimedNotifications.map((notification) => notification.user_id)),
  ]);

  let sentCount = 0;
  let failedCount = 0;

  for (const chunk of chunkItems(claimedNotifications, SEND_CONCURRENCY)) {
    const chunkResults = await Promise.all(
      chunk.map((notification) =>
        deliverClaimedNotification(admin, {
          emailByUserId,
          notification,
          nowIso: context.nowIso,
        }),
      ),
    );

    for (const didSend of chunkResults) {
      if (didSend) {
        sentCount += 1;
      } else {
        failedCount += 1;
      }
    }
  }

  return {
    attemptedCount: claimedNotifications.length,
    failedCount,
    sentCount,
  };
}

export async function openBatch(
  batchId: string,
  actorRole: ActorRole = "system",
) {
  return openBatchCore(createNodeLifecycleContext({ actorRole }), batchId);
}

export async function lockBatch(
  batchId: string,
  actorRole: ActorRole = "system",
) {
  return lockBatchCore(createNodeLifecycleContext({ actorRole }), batchId);
}

export async function processBatch(
  batchId: string,
  actorRole: ActorRole = "system",
) {
  return processBatchCore(createNodeLifecycleContext({ actorRole }), batchId);
}

export async function publishBatch(
  batchId: string,
  actorRole: ActorRole = "system",
) {
  return publishBatchCore(createNodeLifecycleContext({ actorRole }), batchId);
}

export async function rerunFailedBatch(
  batchId: string,
  actorRole: ActorRole = "system",
) {
  return rerunFailedBatchCore(
    createNodeLifecycleContext({ actorRole }),
    batchId,
  );
}

export async function resetInterruptedBatch(
  batchId: string,
  actorRole: ActorRole = "system",
) {
  return resetInterruptedBatchCore(
    createNodeLifecycleContext({ actorRole }),
    batchId,
  );
}

export async function runBatchAutomationSweep(): Promise<BatchAutomationSweepResult> {
  return runBatchAutomationSweepCore(createNodeLifecycleContext({ actorRole: "system" }));
}
