import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  requireAdminUserMock,
  createAdminSupabaseClientMock,
  openBatchMock,
  lockBatchMock,
  processBatchMock,
  publishBatchMock,
  rerunFailedBatchMock,
  resetInterruptedBatchMock,
  fetchBatchLifecycleStateMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  requireAdminUserMock: vi.fn(),
  createAdminSupabaseClientMock: vi.fn(),
  openBatchMock: vi.fn(),
  lockBatchMock: vi.fn(),
  processBatchMock: vi.fn(),
  publishBatchMock: vi.fn(),
  rerunFailedBatchMock: vi.fn(),
  resetInterruptedBatchMock: vi.fn(),
  fetchBatchLifecycleStateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdminUser: requireAdminUserMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("@/lib/matching/batch-runner", () => ({
  openBatch: openBatchMock,
  lockBatch: lockBatchMock,
  processBatch: processBatchMock,
  publishBatch: publishBatchMock,
  rerunFailedBatch: rerunFailedBatchMock,
  resetInterruptedBatch: resetInterruptedBatchMock,
}));

vi.mock("@/lib/matching/lifecycle-core", () => ({
  fetchBatchLifecycleState: fetchBatchLifecycleStateMock,
  hasReachedBatchTime: (plannedAt: string, nowIso: string) =>
    plannedAt <= nowIso,
}));

import {
  createBatchAction,
  lockBatchAction,
  openBatchSignupAction,
  publishBatchNowAction,
  runBatchNowAction,
} from "@/features/admin/batches/actions";

const VALID_BATCH_ID = "11111111-1111-4111-8111-111111111111";

function getQueryParam(url: string, key: string) {
  const [, queryWithHash = ""] = url.split("?");
  const [query = ""] = queryWithHash.split("#");
  return new URLSearchParams(query).get(key);
}

async function captureRedirect(action: Promise<unknown>) {
  await expect(action).rejects.toThrow(/^REDIRECT:/);
  const redirectUrl = redirectMock.mock.lastCall?.[0];
  expect(typeof redirectUrl).toBe("string");
  return redirectUrl as string;
}

function createMatchBatchBuilder(data: Record<string, unknown> | null) {
  const maybeSingleMock = vi.fn().mockResolvedValue({
    data,
    error: null,
  });
  const eqMock = vi.fn().mockReturnValue({
    maybeSingle: maybeSingleMock,
  });
  const selectMock = vi.fn().mockReturnValue({
    eq: eqMock,
  });

  return {
    builder: {
      select: selectMock,
    },
    eqMock,
    maybeSingleMock,
    selectMock,
  };
}

function createBatchCreationHarness() {
  const state = {
    createdBatchPayload: null as Record<string, unknown> | null,
    logs: [] as Array<Record<string, unknown>>,
  };

  const adminClient = {
    from: vi.fn((table: string) => {
      if (table === "operation_logs") {
        return {
          insert: vi.fn(async (payload: Record<string, unknown>) => {
            state.logs.push(payload);
            return { error: null };
          }),
        };
      }

      if (table === "questionnaire_versions") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: "questionnaire-version-1",
                  status: "published",
                  matching_policy_json: {
                    mode: "default",
                  },
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === "match_batches") {
        return {
          select: vi.fn((columns: string, options?: { count?: string; head?: boolean }) => {
            if (options?.count === "exact" && options.head) {
              return {
                in: vi.fn().mockResolvedValue({
                  count: 0,
                  error: null,
                }),
              };
            }

            if (columns === "round_no") {
              return {
                order: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        round_no: 3,
                      },
                      error: null,
                    }),
                  }),
                }),
              };
            }

            throw new Error(`Unexpected match_batches select: ${columns}`);
          }),
          insert: vi.fn((payload: Record<string, unknown>) => {
            state.createdBatchPayload = payload;
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: "batch-created",
                  },
                  error: null,
                }),
              }),
            };
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return { adminClient, state };
}

describe("admin batch actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    requireAdminUserMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
    openBatchMock.mockReset();
    lockBatchMock.mockReset();
    processBatchMock.mockReset();
    publishBatchMock.mockReset();
    rerunFailedBatchMock.mockReset();
    resetInterruptedBatchMock.mockReset();
    fetchBatchLifecycleStateMock.mockReset();

    requireAdminUserMock.mockResolvedValue({
      id: "admin-1",
    });
  });

  it("rejects batch creation when the four timestamps are not strictly increasing", async () => {
    const formData = new FormData();
    formData.set(
      "questionnaireVersionId",
      "11111111-1111-4111-8111-111111111111",
    );
    formData.set("signupStartAt", "2026-03-25T12:00");
    formData.set("signupEndAt", "2026-03-25T11:00");
    formData.set("matchRunAt", "2026-03-25T13:00");
    formData.set("resultPublishAt", "2026-03-25T14:00");

    const redirectUrl = await captureRedirect(createBatchAction(formData));

    expect(getQueryParam(redirectUrl, "error")).toContain(
      "signup_start_at < signup_end_at < match_run_at < result_publish_at",
    );
  });

  it("shows the create-batch error when an unfinished batch already exists", async () => {
    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table !== "match_batches") {
          throw new Error(`Unexpected table: ${table}`);
        }

        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              count: 1,
              error: null,
            }),
          }),
        };
      }),
    });

    const formData = new FormData();
    formData.set(
      "questionnaireVersionId",
      "11111111-1111-4111-8111-111111111111",
    );
    formData.set("signupStartAt", "2026-03-25T10:00");
    formData.set("signupEndAt", "2026-03-25T11:00");
    formData.set("matchRunAt", "2026-03-25T12:00");
    formData.set("resultPublishAt", "2026-03-25T13:00");

    const redirectUrl = await captureRedirect(createBatchAction(formData));

    expect(redirectUrl).toContain("#create-batch-feedback");
    expect(getQueryParam(redirectUrl, "error")).toBe(
      "当前已有未完成批次，不能再新建批次。",
    );
  });

  it("stores batch schedule inputs as UTC converted from Shanghai time", async () => {
    const harness = createBatchCreationHarness();
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const formData = new FormData();
    formData.set(
      "questionnaireVersionId",
      "11111111-1111-4111-8111-111111111111",
    );
    formData.set("signupStartAt", "2026-03-25T12:00");
    formData.set("signupEndAt", "2026-03-25T13:00");
    formData.set("matchRunAt", "2026-03-25T14:00");
    formData.set("resultPublishAt", "2026-03-25T15:00");
    formData.set("notes", "test");

    const redirectUrl = await captureRedirect(createBatchAction(formData));

    expect(redirectUrl).toBe("/admin/batches/batch-created");
    expect(harness.state.createdBatchPayload).toMatchObject({
      signup_start_at: "2026-03-25T04:00:00.000Z",
      signup_end_at: "2026-03-25T05:00:00.000Z",
      match_run_at: "2026-03-25T06:00:00.000Z",
      result_publish_at: "2026-03-25T07:00:00.000Z",
    });
  });

  it("blocks opening signup before signup_start_at", async () => {
    const batchTable = createMatchBatchBuilder({
      signup_start_at: "2999-03-25T12:00:00.000Z",
      status: "draft",
    });

    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "match_batches") {
          return batchTable.builder;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set("batchId", VALID_BATCH_ID);

    const redirectUrl = await captureRedirect(openBatchSignupAction(formData));

    expect(getQueryParam(redirectUrl, "error")).toBe(
      "开始报名时间未到，暂时不能打开报名。",
    );
    expect(openBatchMock).not.toHaveBeenCalled();
  });

  it("blocks manual locking before signup_end_at", async () => {
    createAdminSupabaseClientMock.mockReturnValue({});
    fetchBatchLifecycleStateMock.mockResolvedValue({
      status: "open",
      signup_end_at: "2999-03-25T12:00:00.000Z",
    });

    const formData = new FormData();
    formData.set("batchId", VALID_BATCH_ID);

    const redirectUrl = await captureRedirect(lockBatchAction(formData));

    expect(getQueryParam(redirectUrl, "error")).toBe(
      "报名截止时间未到，暂时不能锁定报名。",
    );
    expect(lockBatchMock).not.toHaveBeenCalled();
  });

  it("blocks manual matching before match_run_at", async () => {
    const batchTable = createMatchBatchBuilder({
      status: "locked",
    });

    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "match_batches") {
          return batchTable.builder;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });
    fetchBatchLifecycleStateMock.mockResolvedValue({
      match_run_at: "2999-03-25T12:00:00.000Z",
    });

    const formData = new FormData();
    formData.set("batchId", VALID_BATCH_ID);

    const redirectUrl = await captureRedirect(runBatchNowAction(formData));

    expect(getQueryParam(redirectUrl, "error")).toBe(
      "匹配计算时间未到，暂时不能执行匹配。",
    );
    expect(processBatchMock).not.toHaveBeenCalled();
    expect(rerunFailedBatchMock).not.toHaveBeenCalled();
  });

  it("blocks manual publishing before result_publish_at", async () => {
    const batchTable = createMatchBatchBuilder({
      processed_at: "2026-03-25T12:00:00.000Z",
      status: "processing",
    });

    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "match_batches") {
          return batchTable.builder;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });
    fetchBatchLifecycleStateMock.mockResolvedValue({
      result_publish_at: "2999-03-25T12:00:00.000Z",
    });

    const formData = new FormData();
    formData.set("batchId", VALID_BATCH_ID);

    const redirectUrl = await captureRedirect(publishBatchNowAction(formData));

    expect(getQueryParam(redirectUrl, "error")).toBe(
      "结果发布时间未到，暂时不能公布结果。",
    );
    expect(publishBatchMock).not.toHaveBeenCalled();
  });
});
