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
    formData.set("batchId", "batch-1");

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
    formData.set("batchId", "batch-1");

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
    formData.set("batchId", "batch-1");

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
    formData.set("batchId", "batch-1");

    const redirectUrl = await captureRedirect(publishBatchNowAction(formData));

    expect(getQueryParam(redirectUrl, "error")).toBe(
      "结果发布时间未到，暂时不能公布结果。",
    );
    expect(publishBatchMock).not.toHaveBeenCalled();
  });
});
