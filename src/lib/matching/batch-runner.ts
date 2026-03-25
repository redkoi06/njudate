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
  syncMatchResultNotifications,
  type BatchAutomationSweepResult,
  type BatchLifecycleContext,
} from "@/lib/matching/lifecycle-core";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

type ActorRole = "admin" | "system";

function createNodeLifecycleContext(input?: {
  actorRole?: ActorRole;
  afterPublish?: BatchLifecycleContext["afterPublish"];
}) {
  return {
    admin: createAdminSupabaseClient(),
    actorRole: input?.actorRole ?? "system",
    afterPublish: input?.afterPublish,
    createUuid: () => crypto.randomUUID(),
    nowIso: new Date().toISOString(),
  } satisfies BatchLifecycleContext;
}

export async function syncPendingMatchResultEmails(batchId: string) {
  const context = createNodeLifecycleContext();
  const admin = context.admin;

  await syncMatchResultNotifications(context, {
    batchId,
    async deliver(notification) {
      const authResult = await admin.auth.admin.getUserById(
        notification.user_id,
      );
      const email = authResult.data.user?.email ?? null;

      if (!email) {
        await admin
          .from("notifications")
          .update({ email_status: "failed", emailed_at: null })
          .eq("id", notification.id);
        return;
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
          emailed_at: emailResult.ok ? context.nowIso : null,
        })
        .eq("id", notification.id);
    },
    async markNotificationFailed(notificationId) {
      await admin
        .from("notifications")
        .update({ email_status: "failed", emailed_at: null })
        .eq("id", notificationId);
    },
  });
}

function createPublishingContext(actorRole: ActorRole) {
  return createNodeLifecycleContext({
    actorRole,
    afterPublish: syncPendingMatchResultEmails,
  });
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
  return publishBatchCore(createPublishingContext(actorRole), batchId);
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
  return runBatchAutomationSweepCore(createPublishingContext("system"));
}
