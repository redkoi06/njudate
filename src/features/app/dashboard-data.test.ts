import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock, getEffectiveQuestionnaireContextMock } =
  vi.hoisted(() => ({
    createServerSupabaseClientMock: vi.fn(),
    getEffectiveQuestionnaireContextMock: vi.fn(),
  }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/features/app/questionnaire-runtime", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/app/questionnaire-runtime")
  >("@/features/app/questionnaire-runtime");

  return {
    ...actual,
    getEffectiveQuestionnaireContext: getEffectiveQuestionnaireContextMock,
  };
});

import { getDashboardData } from "@/features/app/data";

describe("getDashboardData", () => {
  beforeEach(() => {
    createServerSupabaseClientMock.mockReset();
    getEffectiveQuestionnaireContextMock.mockReset();
  });

  it("returns no participation when there is no current round", async () => {
    getEffectiveQuestionnaireContextMock.mockResolvedValue({
      batchId: null,
      batchStatus: null,
      description: "当前生效问卷",
      matchingPolicyJson: {},
      resultPublishAt: null,
      signupEndAt: null,
      source: "published",
      title: "问卷",
      versionId: "version-1",
      versionNo: 3,
      versionStatus: "published",
      windowStatus: "open",
    });

    createServerSupabaseClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(async () => ({
                  data: {
                    id: "user-1",
                    nickname: "阿南",
                    gender: "男",
                    grade: "大三",
                    department: "计算机学院",
                    campus: "仙林校区",
                    birth_year: 2002,
                    account_status: "active",
                  },
                  error: null,
                })),
              })),
            })),
          };
        }

        if (table === "questionnaire_sections") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(async () => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          };
        }

        if (table === "questionnaire_questions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(async () => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          };
        }

        if (table === "questionnaire_submissions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                eq: vi.fn(() => ({
                  order: vi.fn(async () => ({
                    data: [],
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const dashboard = await getDashboardData("user-1");

    expect(dashboard.hasJoinedCurrentBatch).toBe(false);
  });
});
