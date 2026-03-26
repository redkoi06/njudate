import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSupabaseClientMock } = vi.hoisted(() => ({
  createAdminSupabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

import { getQuestionnairePublishingGate } from "@/features/admin/questionnaires/data";

type BatchStatus =
  | "draft"
  | "open"
  | "locked"
  | "processing"
  | "published"
  | "failed";

function mockMatchBatchCount(statuses: BatchStatus[]) {
  createAdminSupabaseClientMock.mockReturnValue({
    from: vi.fn((table: string) => {
      if (table !== "match_batches") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: vi.fn((_columns: string, options?: { count?: "exact"; head?: boolean }) => {
          expect(options).toEqual({ count: "exact", head: true });

          return {
            eq: vi.fn(async (column: string, value: BatchStatus) => {
              expect(column).toBe("status");
              return {
                count: statuses.filter((status) => status === value).length,
                error: null,
              };
            }),
          };
        }),
      };
    }),
  });
}

describe("getQuestionnairePublishingGate", () => {
  beforeEach(() => {
    createAdminSupabaseClientMock.mockReset();
  });

  it("allows managing questionnaires when there are no batches", async () => {
    mockMatchBatchCount([]);

    await expect(getQuestionnairePublishingGate()).resolves.toEqual({
      canManage: true,
      reason: null,
    });
  });

  it("allows managing questionnaires when only historical batches exist", async () => {
    mockMatchBatchCount(["published"]);

    await expect(getQuestionnairePublishingGate()).resolves.toEqual({
      canManage: true,
      reason: null,
    });
  });

  it("allows managing questionnaires when the current batch is not open", async () => {
    mockMatchBatchCount(["locked", "processing", "failed", "published"]);

    await expect(getQuestionnairePublishingGate()).resolves.toEqual({
      canManage: true,
      reason: null,
    });
  });

  it("blocks managing questionnaires when an open batch exists", async () => {
    mockMatchBatchCount(["draft", "open", "published"]);

    await expect(getQuestionnairePublishingGate()).resolves.toEqual({
      canManage: false,
      reason: "当前存在 open 批次，不能导入或发布新问卷。",
    });
  });
});
