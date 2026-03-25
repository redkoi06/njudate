import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminSupabaseClientMock,
  countActiveSubmittedQuestionnaireUsersMock,
  getEffectiveQuestionnaireContextMock,
} = vi.hoisted(() => ({
  createAdminSupabaseClientMock: vi.fn(),
  countActiveSubmittedQuestionnaireUsersMock: vi.fn(),
  getEffectiveQuestionnaireContextMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("@/lib/questionnaire-metrics", () => ({
  countActiveSubmittedQuestionnaireUsers:
    countActiveSubmittedQuestionnaireUsersMock,
}));

vi.mock("@/features/app/questionnaire-runtime", () => ({
  getEffectiveQuestionnaireContext: getEffectiveQuestionnaireContextMock,
}));

import { getAdminDashboardData } from "@/features/admin/data";

function createHeadCountQuery(count: number) {
  const query: Record<string, unknown> = {
    neq: vi.fn(() => query),
    gte: vi.fn(() =>
      Promise.resolve({
        count,
        error: null,
      }),
    ),
    then<TResult1, TResult2 = never>(
      onfulfilled?:
        | ((value: {
            count: number;
            error: null;
          }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?:
        | ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
        | null,
    ) {
      return Promise.resolve({ count, error: null }).then(
        onfulfilled,
        onrejected,
      );
    },
  };

  return query;
}

describe("getAdminDashboardData", () => {
  beforeEach(() => {
    createAdminSupabaseClientMock.mockReset();
    countActiveSubmittedQuestionnaireUsersMock.mockReset();
    getEffectiveQuestionnaireContextMock.mockReset();
  });

  it("uses active non-deleted questionnaire users for completion rate", async () => {
    countActiveSubmittedQuestionnaireUsersMock.mockResolvedValue(2);
    getEffectiveQuestionnaireContextMock.mockResolvedValue({
      versionId: "version-1",
      versionNo: 3,
    });

    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return {
            select: vi.fn((_columns: string, options?: { head?: boolean }) =>
              options?.head ? createHeadCountQuery(4) : null,
            ),
          };
        }

        if (table === "match_batches") {
          return {
            select: vi.fn((columns: string) => {
              if (columns.includes("signup_end_at")) {
                return {
                  in: vi.fn(() => ({
                    order: vi.fn(() => ({
                      limit: vi.fn(() => ({
                        maybeSingle: vi.fn(async () => ({
                          data: null,
                          error: null,
                        })),
                      })),
                    })),
                  })),
                };
              }

              return {
                in: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => ({
                        data: null,
                        error: null,
                      })),
                    })),
                  })),
                })),
                eq: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => ({
                        data: null,
                        error: null,
                      })),
                    })),
                  })),
                })),
              };
            }),
          };
        }

        if (table === "announcements") {
          return {
            select: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () => ({
                    data: null,
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }

        if (table === "operation_logs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => ({
                      maybeSingle: vi.fn(async () => ({
                        data: null,
                        error: null,
                      })),
                    })),
                  })),
                })),
              })),
              order: vi.fn(() => ({
                limit: vi.fn(async () => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          };
        }

        if (table === "match_results") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(async () => ({
                data: [],
                error: null,
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const dashboard = await getAdminDashboardData();

    expect(dashboard.currentQuestionnaire.completionCount).toBe(2);
    expect(dashboard.currentQuestionnaire.completionRate).toBe(50);
  });
});
