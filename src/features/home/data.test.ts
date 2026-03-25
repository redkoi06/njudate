import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  countActiveSubmittedQuestionnaireUsersMock,
  createAdminSupabaseClientMock,
} = vi.hoisted(() => ({
  countActiveSubmittedQuestionnaireUsersMock: vi.fn(),
  createAdminSupabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/questionnaire-metrics", () => ({
  countActiveSubmittedQuestionnaireUsers:
    countActiveSubmittedQuestionnaireUsersMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

import { getHomePageData } from "@/features/home/data";

function createAdminClient(input: {
  currentBatch:
    | {
        id: string;
        label: string;
        match_run_at: string | null;
        questionnaire_version_id: string;
        result_publish_at: string | null;
        signup_end_at: string;
        status: "open" | "locked" | "processing" | "failed";
      }
    | null;
  matchedUserIds?: string[];
  matchScheduleText?: string | null;
  newUsersCount?: number;
  participantsCount?: number;
  publishedVersionId?: string | null;
  registeredUsersCount?: number;
}) {
  const appUsersQuery = {
    gte: vi.fn(() =>
      Promise.resolve({
        count: input.newUsersCount ?? 1,
        error: null,
      }),
    ),
    then<TResult1, TResult2 = never>(
      onfulfilled?:
        | ((value: { count: number; error: null }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve({
        count: input.registeredUsersCount ?? 4,
        error: null,
      }).then(onfulfilled, onrejected);
    },
  };

  const matchBatchesMaybeSingleMock = vi.fn(async () => ({
    data: input.currentBatch,
    error: null,
  }));
  const matchBatchesInMock = vi.fn(() => ({
    order: vi.fn(() => ({
      limit: vi.fn(() => ({
        maybeSingle: matchBatchesMaybeSingleMock,
      })),
    })),
  }));

  const questionnaireVersionsMaybeSingleMock = vi.fn(async () => ({
    data: input.publishedVersionId ? { id: input.publishedVersionId } : null,
    error: null,
  }));

  const client = {
    from: vi.fn((table: string) => {
      if (table === "match_batches") {
        return {
          select: vi.fn(() => ({
            in: matchBatchesInMock,
          })),
        };
      }

      if (table === "questionnaire_versions") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: questionnaireVersionsMaybeSingleMock,
                })),
              })),
            })),
          })),
        };
      }

      if (table === "app_configs") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({
                data:
                  typeof input.matchScheduleText === "string"
                    ? { value_json: input.matchScheduleText }
                    : null,
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === "app_users") {
        return {
          select: vi.fn(() => ({
            neq: vi.fn(() => appUsersQuery),
          })),
        };
      }

      if (table === "match_results") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              not: vi.fn(async () => ({
                data: (input.matchedUserIds ?? []).map((userId) => ({ user_id: userId })),
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === "batch_participations") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              in: vi.fn(async () => ({
                count: input.participantsCount ?? 0,
                error: null,
              })),
            })),
          })),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  };

  return {
    client,
    matchBatchesInMock,
  };
}

describe("getHomePageData", () => {
  beforeEach(() => {
    countActiveSubmittedQuestionnaireUsersMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
  });

  it.each([
    {
      status: "locked" as const,
      label: "第 12 轮",
    },
    {
      status: "processing" as const,
      label: "第 13 轮",
    },
    {
      status: "failed" as const,
      label: "第 14 轮",
    },
  ])("treats $status batch as the current round on the home page", async ({ label, status }) => {
    countActiveSubmittedQuestionnaireUsersMock.mockResolvedValue(2);
    const currentBatch = {
      id: `batch-${status}`,
      label,
      status,
      questionnaire_version_id: "version-current",
      signup_end_at: "2026-03-26T12:00:00.000Z",
      match_run_at: "2026-03-26T15:00:00.000Z",
      result_publish_at: "2026-03-26T20:00:00.000Z",
    };
    const harness = createAdminClient({
      currentBatch,
      participantsCount: 7,
      publishedVersionId: "version-published",
    });
    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    const homeData = await getHomePageData(false);

    expect(harness.matchBatchesInMock).toHaveBeenCalledWith("status", [
      "open",
      "locked",
      "processing",
      "failed",
    ]);
    expect(countActiveSubmittedQuestionnaireUsersMock).toHaveBeenCalledWith(
      harness.client,
      "version-current",
    );
    expect(homeData.currentBatchLabel).toBe(label);
    expect(homeData.currentBatchParticipants).toBe(7);
    expect(homeData.countdownTargetAt).toBe("2026-03-26T20:00:00.000Z");
  });

  it("falls back to the published questionnaire only when there is no current batch", async () => {
    countActiveSubmittedQuestionnaireUsersMock.mockResolvedValue(2);
    const harness = createAdminClient({
      currentBatch: null,
      publishedVersionId: "version-published",
      matchedUserIds: ["user-1"],
      registeredUsersCount: 4,
    });
    createAdminSupabaseClientMock.mockReturnValue(harness.client);

    const homeData = await getHomePageData(false);

    expect(countActiveSubmittedQuestionnaireUsersMock).toHaveBeenCalledWith(
      harness.client,
      "version-published",
    );
    expect(homeData.currentBatchLabel).toBeNull();
    expect(homeData.currentBatchParticipants).toBe(0);
    expect(homeData.countdownTargetAt).toBeNull();
    expect(homeData.questionnaireCompletedUsers).toBe(2);
    expect(homeData.questionnaireCompletionRate).toBe(50);
  });
});
