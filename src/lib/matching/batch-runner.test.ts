import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSupabaseClientMock, sendTransactionalEmailMock } =
  vi.hoisted(() => ({
    createAdminSupabaseClientMock: vi.fn(),
    sendTransactionalEmailMock: vi.fn(),
  }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("@/lib/email/send", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

import {
  drainMatchResultEmailQueue,
  processBatch,
  resetInterruptedBatch,
  rerunFailedBatch,
  runBatchAutomationSweep,
} from "@/lib/matching/batch-runner";

type TestBatchStatus =
  | "draft"
  | "failed"
  | "locked"
  | "open"
  | "processing"
  | "published";

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

const MATCHING_POLICY = {
  minimumPairScore: 60,
  profileFilters: [{ field: "gender", mode: "opposite_required" }],
  profileScoring: [],
  questionScoring: {
    singleDefaultWeight: 1,
    multipleDefaultWeight: 1.2,
    scaleDefaultWeight: 1.5,
    minimumComparableQuestions: 1,
  },
};

class FakeQuery {
  private filters: Array<{
    field: string;
    kind: "eq" | "in" | "is" | "lt" | "lte" | "not";
    value: unknown;
  }> = [];

  private selectedColumns: string | null = null;

  constructor(
    private readonly table: string,
    private readonly action: "delete" | "select" | "update",
    private readonly payload: unknown,
    private readonly state: ReturnType<typeof createBatchHarness>["state"],
  ) {}

  eq(field: string, value: unknown) {
    this.filters.push({ field, kind: "eq", value });
    return this;
  }

  in(field: string, value: unknown) {
    this.filters.push({ field, kind: "in", value });
    return this;
  }

  is(field: string, value: unknown) {
    this.filters.push({ field, kind: "is", value });
    return this;
  }

  lt(field: string, value: unknown) {
    this.filters.push({ field, kind: "lt", value });
    return this;
  }

  lte(field: string, value: unknown) {
    this.filters.push({ field, kind: "lte", value });
    return this;
  }

  not(field: string, value: unknown, extra: unknown) {
    this.filters.push({ field, kind: "not", value: [value, extra] });
    return this;
  }

  order() {
    return this;
  }

  select(columns: string) {
    this.selectedColumns = columns;
    return this;
  }

  async maybeSingle() {
    const result = await this.resolve();
    const rows = Array.isArray(result.data)
      ? result.data
      : result.data
        ? [result.data]
        : [];

    return {
      data: rows[0] ?? null,
      error: result.error,
    };
  }

  then<TResult1 = Awaited<ReturnType<FakeQuery["resolve"]>>, TResult2 = never>(
    onfulfilled?:
      | ((
          value: Awaited<ReturnType<FakeQuery["resolve"]>>,
        ) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.resolve().then(onfulfilled, onrejected);
  }

  private async resolve() {
    switch (this.table) {
      case "batch_participations":
        return this.resolveBatchParticipations();
      case "match_batches":
        return this.resolveMatchBatches();
      case "match_pairs":
        return this.resolveMatchPairs();
      case "match_results":
        return this.resolveMatchResults();
      case "notifications":
        return { data: [], error: null };
      case "questionnaire_questions":
        return { data: [], error: null };
      default:
        throw new Error(`Unexpected query table: ${this.table}`);
    }
  }

  private getEqValue(field: string) {
    return this.filters.find(
      (filter) => filter.kind === "eq" && filter.field === field,
    )?.value;
  }

  private getInValue(field: string) {
    return this.filters.find(
      (filter) => filter.kind === "in" && filter.field === field,
    )?.value;
  }

  private hasFilter(kind: FakeQuery["filters"][number]["kind"], field: string) {
    return this.filters.some(
      (filter) => filter.kind === kind && filter.field === field,
    );
  }

  private getIsValue(field: string) {
    return this.filters.find(
      (filter) => filter.kind === "is" && filter.field === field,
    )?.value;
  }

  private pickBatchRow() {
    return {
      id: this.state.batch.id,
      label: this.state.batch.label,
      last_error_message: this.state.batch.last_error_message,
      match_run_at: this.state.batch.match_run_at,
      matching_policy_snapshot_json:
        this.state.batch.matching_policy_snapshot_json,
      processed_at: this.state.batch.processed_at,
      questionnaire_version_id: this.state.batch.questionnaire_version_id,
      result_publish_at: this.state.batch.result_publish_at,
      signup_end_at: this.state.batch.signup_end_at,
      signup_start_at: this.state.batch.signup_start_at,
      status: this.state.batch.status,
    };
  }

  private async resolveBatchParticipations() {
    if (this.action === "update") {
      this.state.lockJoinedCalls += 1;
      return { data: null, error: null };
    }

    return { data: [], error: null };
  }

  private async resolveMatchBatches() {
    if (this.action === "select") {
      const batchId = this.getEqValue("id");
      const statuses = this.getInValue("status");

      if (typeof batchId === "string") {
        return {
          data: batchId === this.state.batch.id ? [this.pickBatchRow()] : [],
          error: null,
        };
      }

      if (
        Array.isArray(statuses) &&
        !statuses.includes(this.state.batch.status)
      ) {
        return { data: [], error: null };
      }

      return {
        data: [this.pickBatchRow()],
        error: null,
      };
    }

    if (this.action === "update") {
      const batchId = this.getEqValue("id");
      const expectedStatus = this.getEqValue("status");
      const expectedProcessedAt = this.getIsValue("processed_at");

      if (batchId !== this.state.batch.id) {
        return { data: this.selectedColumns ? null : null, error: null };
      }

      if (typeof expectedStatus === "string") {
        if (this.state.batch.status !== expectedStatus) {
          return { data: this.selectedColumns ? null : null, error: null };
        }

        if (
          this.hasFilter("is", "processed_at") &&
          this.state.batch.processed_at !== expectedProcessedAt
        ) {
          return { data: this.selectedColumns ? null : null, error: null };
        }

        Object.assign(this.state.batch, this.payload);
        return {
          data: this.selectedColumns ? this.pickBatchRow() : null,
          error: null,
        };
      }

      Object.assign(this.state.batch, this.payload);
      return { data: null, error: null };
    }

    throw new Error(`Unsupported match_batches action: ${this.action}`);
  }

  private async resolveMatchPairs() {
    if (this.action === "delete") {
      this.state.deletePairsCalls += 1;
      return { data: null, error: null };
    }

    throw new Error(`Unsupported match_pairs action: ${this.action}`);
  }

  private async resolveMatchResults() {
    if (this.action === "select") {
      return { data: [], error: null };
    }

    if (this.action === "delete") {
      this.state.deleteResultsCalls += 1;
      return { data: null, error: null };
    }

    throw new Error(`Unsupported match_results action: ${this.action}`);
  }
}

function createBatchHarness(input: {
  initialProcessedAt?: string | null;
  initialStatus: TestBatchStatus;
}) {
  const state = {
    batch: {
      id: "batch-1",
      label: "Round 1",
      last_error_message: null as string | null,
      match_run_at: "2026-03-25T10:00:00.000Z",
      matching_policy_snapshot_json: MATCHING_POLICY,
      processed_at: input.initialProcessedAt ?? null,
      published_at: null as string | null,
      questionnaire_version_id: "version-1",
      result_publish_at: "2026-03-25T11:00:00.000Z",
      signup_end_at: "2026-03-25T09:00:00.000Z",
      signup_start_at: "2026-03-25T08:00:00.000Z",
      status: input.initialStatus,
    },
    deletePairsCalls: 0,
    deleteResultsCalls: 0,
    lockJoinedCalls: 0,
    operationLogs: [] as unknown[],
  };

  const client = {
    from: vi.fn((table: string) => {
      if (table === "operation_logs") {
        return {
          insert: vi.fn(async (payload: unknown) => {
            state.operationLogs.push(payload);
            return { error: null };
          }),
        };
      }

      if (table === "questionnaire_questions") {
        return {
          select: () => new FakeQuery(table, "select", null, state),
        };
      }

      return {
        delete: () => new FakeQuery(table, "delete", null, state),
        select: () => new FakeQuery(table, "select", null, state),
        update: (payload: unknown) =>
          new FakeQuery(table, "update", payload, state),
      };
    }),
    rpc: vi.fn(async (fn: string) => {
      if (fn === "publish_match_batch") {
        state.batch.status = "published";
        state.batch.published_at = "2026-03-25T12:00:00.000Z";
        return { error: null };
      }

      return { error: null };
    }),
  };

  return { client, state };
}

function createEmailQueueHarness(input: {
  authUsers: AuthUserLookupRow[];
  claimedNotifications: ClaimedNotificationRow[];
}) {
  const state = {
    claimArgs: null as { p_limit: number; p_reclaim_before: string } | null,
    lookupArgs: null as { p_user_ids: string[] } | null,
    notificationUpdates: [] as Array<{
      id: string;
      payload: {
        email_claimed_at: null;
        emailed_at: string | null;
        email_status: string;
      };
    }>,
  };

  const getUserById = vi.fn();

  const client = {
    auth: {
      admin: {
        getUserById,
      },
    },
    from: vi.fn((table: string) => {
      if (table !== "notifications") {
        throw new Error(`Unexpected queue table: ${table}`);
      }

      return {
        update: (payload: {
          email_claimed_at: null;
          emailed_at: string | null;
          email_status: string;
        }) => ({
          eq: vi.fn(async (_field: string, id: string) => {
            state.notificationUpdates.push({ id, payload });
            return { error: null };
          }),
        }),
      };
    }),
    rpc: vi.fn(
      async (
        fn: string,
        args:
          | { p_limit: number; p_reclaim_before: string }
          | { p_user_ids: string[] },
      ) => {
        if (fn === "claim_pending_match_result_email_notifications") {
          state.claimArgs = args as { p_limit: number; p_reclaim_before: string };
          return {
            data: input.claimedNotifications,
            error: null,
          };
        }

        if (fn === "get_auth_users_by_ids") {
          state.lookupArgs = args as { p_user_ids: string[] };
          return {
            data: input.authUsers.filter((row) =>
              state.lookupArgs?.p_user_ids.includes(row.user_id),
            ),
            error: null,
          };
        }

        throw new Error(`Unexpected queue rpc: ${fn}`);
      },
    ),
  };

  return { client, getUserById, state };
}

describe("batch runner", () => {
  beforeEach(() => {
    createAdminSupabaseClientMock.mockReset();
    sendTransactionalEmailMock.mockReset();
    vi.useRealTimers();
  });

  it("claims a locked batch only once and skips the second processing attempt", async () => {
    const harness = createBatchHarness({
      initialStatus: "locked",
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    await expect(processBatch("batch-1")).resolves.toBe(true);
    await expect(processBatch("batch-1")).resolves.toBe(false);

    expect(harness.state.deleteResultsCalls).toBe(1);
    expect(harness.state.deletePairsCalls).toBe(1);
    expect(harness.state.batch.status).toBe("processing");
    expect(harness.state.batch.processed_at).toBeTruthy();
    expect(harness.state.operationLogs).toHaveLength(1);
  });

  it("allows only one failed-batch rerun to claim processing", async () => {
    const harness = createBatchHarness({
      initialStatus: "failed",
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    await expect(rerunFailedBatch("batch-1")).resolves.toBe(true);
    await expect(rerunFailedBatch("batch-1")).resolves.toBe(false);

    expect(harness.state.deleteResultsCalls).toBe(1);
    expect(harness.state.deletePairsCalls).toBe(1);
    expect(harness.state.batch.status).toBe("processing");
    expect(harness.state.batch.processed_at).toBeTruthy();
  });

  it("resets an interrupted processing batch to failed", async () => {
    const harness = createBatchHarness({
      initialStatus: "processing",
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    await expect(resetInterruptedBatch("batch-1")).resolves.toBe(true);

    expect(harness.state.batch.status).toBe("failed");
    expect(harness.state.batch.last_error_message).toContain("处理过程中断");
    expect(harness.state.operationLogs).toHaveLength(1);
  });

  it("does not reset a processing batch that has already finished computation", async () => {
    const harness = createBatchHarness({
      initialProcessedAt: "2026-03-25T12:00:00.000Z",
      initialStatus: "processing",
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    await expect(resetInterruptedBatch("batch-1")).resolves.toBe(false);

    expect(harness.state.batch.status).toBe("processing");
    expect(harness.state.operationLogs).toHaveLength(0);
  });

  it("advances a due draft batch through open, lock, process, and publish in one sweep", async () => {
    const harness = createBatchHarness({
      initialStatus: "draft",
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    const result = await runBatchAutomationSweep();

    expect(result.results).toHaveLength(1);
    expect(result.results[0]?.actions).toEqual([
      "opened",
      "locked",
      "processed",
      "published",
    ]);
    expect(harness.state.batch.status).toBe("published");
    expect(harness.state.batch.processed_at).toBeTruthy();
    expect(harness.state.deleteResultsCalls).toBe(1);
    expect(harness.state.deletePairsCalls).toBe(1);
  });

  it("does not automatically rerun failed batches", async () => {
    const harness = createBatchHarness({
      initialStatus: "failed",
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    const result = await runBatchAutomationSweep();

    expect(result.results).toHaveLength(0);
    expect(harness.state.batch.status).toBe("failed");
    expect(harness.state.deleteResultsCalls).toBe(0);
    expect(harness.state.deletePairsCalls).toBe(0);
  });

  it("drains the queue in chunks of five after claiming up to fifty emails", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const claimedNotifications = Array.from({ length: 12 }, (_, index) => ({
      body: `body-${index + 1}`,
      notification_id: `notification-${index + 1}`,
      title: `title-${index + 1}`,
      user_id: `user-${index + 1}`,
    }));
    const harness = createEmailQueueHarness({
      authUsers: claimedNotifications.map((notification, index) => ({
        banned_until: null,
        email: `user-${index + 1}@smail.nju.edu.cn`,
        user_id: notification.user_id,
      })),
      claimedNotifications,
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);
    sendTransactionalEmailMock.mockImplementation(
      async (_input: { text: string; to: string; subject: string }) => {
        inFlight += 1;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await Promise.resolve();
        inFlight -= 1;

        return {
          ok: true,
          reason: null,
        };
      },
    );

    const result = await drainMatchResultEmailQueue();

    expect(result).toEqual({
      attemptedCount: 12,
      failedCount: 0,
      sentCount: 12,
    });
    expect(harness.state.claimArgs).toEqual({
      p_limit: 50,
      p_reclaim_before: expect.any(String),
    });
    expect(harness.state.lookupArgs).toEqual({
      p_user_ids: claimedNotifications.map((notification) => notification.user_id),
    });
    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(12);
    expect(harness.client.rpc).toHaveBeenCalledTimes(2);
    expect(harness.getUserById).not.toHaveBeenCalled();
    expect(maxInFlight).toBe(5);
    expect(harness.state.notificationUpdates).toHaveLength(12);
    expect(
      harness.state.notificationUpdates.every(
        (update) =>
          update.payload.email_status === "sent" &&
          typeof update.payload.emailed_at === "string" &&
          update.payload.email_claimed_at === null,
      ),
    ).toBe(true);
  });

  it("marks notifications as failed when email addresses are missing or sends fail", async () => {
    const claimedNotifications = [
      {
        body: "body-1",
        notification_id: "notification-1",
        title: "title-1",
        user_id: "user-1",
      },
      {
        body: "body-2",
        notification_id: "notification-2",
        title: "title-2",
        user_id: "user-2",
      },
      {
        body: "body-3",
        notification_id: "notification-3",
        title: "title-3",
        user_id: "user-3",
      },
    ];
    const harness = createEmailQueueHarness({
      authUsers: [
        {
          banned_until: null,
          email: "user-1@smail.nju.edu.cn",
          user_id: "user-1",
        },
        {
          banned_until: null,
          email: "user-2@smail.nju.edu.cn",
          user_id: "user-2",
        },
      ],
      claimedNotifications,
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);
    sendTransactionalEmailMock.mockImplementation(
      async (input: { text: string; to: string; subject: string }) => ({
        ok: input.to !== "user-2@smail.nju.edu.cn",
        reason:
          input.to === "user-2@smail.nju.edu.cn" ? "smtp_error" : null,
      }),
    );

    const result = await drainMatchResultEmailQueue();

    expect(result).toEqual({
      attemptedCount: 3,
      failedCount: 2,
      sentCount: 1,
    });
    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(2);
    expect(harness.getUserById).not.toHaveBeenCalled();
    expect(harness.state.notificationUpdates).toHaveLength(3);
    expect(harness.state.notificationUpdates).toEqual(
      expect.arrayContaining([
        {
          id: "notification-1",
          payload: {
            email_claimed_at: null,
            emailed_at: expect.any(String),
            email_status: "sent",
          },
        },
        {
          id: "notification-2",
          payload: {
            email_claimed_at: null,
            emailed_at: null,
            email_status: "failed",
          },
        },
        {
          id: "notification-3",
          payload: {
            email_claimed_at: null,
            emailed_at: null,
            email_status: "failed",
          },
        },
      ]),
    );
  });

  it("uses a ten-minute reclaim cutoff when claiming pending emails", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-30T10:00:00.000Z"));
    const harness = createEmailQueueHarness({
      authUsers: [],
      claimedNotifications: [],
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    await expect(drainMatchResultEmailQueue()).resolves.toEqual({
      attemptedCount: 0,
      failedCount: 0,
      sentCount: 0,
    });

    expect(harness.state.claimArgs).toEqual({
      p_limit: 50,
      p_reclaim_before: "2026-03-30T09:50:00.000Z",
    });
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
    expect(harness.client.rpc).toHaveBeenCalledTimes(1);
  });
});
