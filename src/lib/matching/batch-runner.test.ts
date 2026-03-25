import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSupabaseClientMock } = vi.hoisted(() => ({
  createAdminSupabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("@/lib/email/send", () => ({
  sendTransactionalEmail: vi.fn(),
}));

import {
  processBatch,
  resetInterruptedBatch,
  rerunFailedBatch,
} from "@/lib/matching/batch-runner";

type TestBatchStatus = "failed" | "locked" | "processing";

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
      | ((value: Awaited<ReturnType<FakeQuery["resolve"]>>) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?:
      | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
      | null,
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

  private hasFilter(kind: FakeQuery["filters"][number]["kind"], field: string) {
    return this.filters.some((filter) => filter.kind === kind && filter.field === field);
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
      processed_at: this.state.batch.processed_at,
      matching_policy_snapshot_json: this.state.batch.matching_policy_snapshot_json,
      questionnaire_version_id: this.state.batch.questionnaire_version_id,
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

      if (typeof batchId === "string") {
        return {
          data: batchId === this.state.batch.id ? [this.pickBatchRow()] : [],
          error: null,
        };
      }

      return { data: [], error: null };
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
  initialStatus: TestBatchStatus;
  initialProcessedAt?: string | null;
}) {
  const state = {
    batch: {
      id: "batch-1",
      label: "Round 1",
      last_error_message: null as string | null,
      matching_policy_snapshot_json: MATCHING_POLICY,
      processed_at: input.initialProcessedAt ?? null,
      published_at: null as string | null,
      questionnaire_version_id: "version-1",
      status: input.initialStatus,
    },
    deletePairsCalls: 0,
    deleteResultsCalls: 0,
    lockJoinedCalls: 0,
    operationLogs: [] as unknown[],
  };

  const client = {
    auth: {
      admin: {
        getUserById: vi.fn(),
      },
    },
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
        update: (payload: unknown) => new FakeQuery(table, "update", payload, state),
      };
    }),
    rpc: vi.fn(),
  };

  return { client, state };
}

describe("batch runner", () => {
  beforeEach(() => {
    createAdminSupabaseClientMock.mockReset();
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
      initialStatus: "processing",
      initialProcessedAt: "2026-03-25T12:00:00.000Z",
    });

    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    await expect(resetInterruptedBatch("batch-1")).resolves.toBe(false);

    expect(harness.state.batch.status).toBe("processing");
    expect(harness.state.operationLogs).toHaveLength(0);
  });
});
