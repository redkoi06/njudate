import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createAdminSupabaseClientMock,
  getEffectiveQuestionnaireContextMock,
  listUsersMock,
} = vi.hoisted(() => ({
  createAdminSupabaseClientMock: vi.fn(),
  getEffectiveQuestionnaireContextMock: vi.fn(),
  listUsersMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("@/features/app/questionnaire-runtime", async () => {
  const actual = await vi.importActual<typeof import("@/features/app/questionnaire-runtime")>(
    "@/features/app/questionnaire-runtime",
  );

  return {
    ...actual,
    getEffectiveQuestionnaireContext: getEffectiveQuestionnaireContextMock,
  };
});

import { listAdminUsers } from "@/features/admin/users/data";

describe("listAdminUsers", () => {
  beforeEach(() => {
    createAdminSupabaseClientMock.mockReset();
    getEffectiveQuestionnaireContextMock.mockReset();
    listUsersMock.mockReset();
  });

  it("maps profile, questionnaire, participation and auth-ban status for the admin list", async () => {
    getEffectiveQuestionnaireContextMock.mockResolvedValue({
      batchId: "batch-1",
      batchStatus: "open",
      description: "desc",
      matchingPolicyJson: {},
      resultPublishAt: null,
      signupEndAt: null,
      source: "batch",
      title: "问卷",
      versionId: "version-1",
      versionNo: 3,
      versionStatus: "published",
      windowStatus: "open",
    });

    const getUserByIdMock = vi.fn(async (userId: string) => {
      if (userId === "user-1") {
        return {
          data: {
            user: {
              email: "user1@smail.nju.edu.cn",
              banned_until: "2099-01-01T00:00:00.000Z",
            },
          },
          error: null,
        };
      }

      return {
        data: {
          user: {
            email: "user2@smail.nju.edu.cn",
            banned_until: null,
          },
        },
        error: null,
      };
    });

    createAdminSupabaseClientMock.mockReturnValue({
      auth: {
        admin: {
          getUserById: getUserByIdMock,
          listUsers: listUsersMock,
        },
      },
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return {
            select: vi.fn((columns: string, options?: { count?: "exact"; head?: boolean }) => {
              if (options?.head) {
                return Promise.resolve({
                  count: 2,
                  error: null,
                });
              }

              return {
                order: vi.fn(() => ({
                  range: vi.fn(async () => ({
                    data: [
                      {
                        id: "user-1",
                        role: "user",
                        account_status: "active",
                        nickname: "阿南",
                        gender: "男",
                        grade: "大三",
                        department: "计算机学院",
                        campus: "仙林校区",
                        birth_year: 2002,
                        deleted_at: null,
                        created_at: "2026-03-01T12:00:00.000Z",
                      },
                      {
                        id: "user-2",
                        role: "user",
                        account_status: "deleted",
                        nickname: null,
                        gender: null,
                        grade: null,
                        department: null,
                        campus: null,
                        birth_year: null,
                        deleted_at: "2026-03-20T12:00:00.000Z",
                        created_at: "2026-02-01T12:00:00.000Z",
                      },
                    ],
                    error: null,
                  })),
                })),
              };
            }),
          };
        }

        if (table === "questionnaire_submissions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  order: vi.fn(async () => ({
                    data: [
                      { user_id: "user-1", status: "submitted", submission_no: 2 },
                      { user_id: "user-2", status: "draft", submission_no: 1 },
                    ],
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }

        if (table === "batch_participations") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(async () => ({
                  data: [
                    {
                      user_id: "user-1",
                      batch_id: "batch-1",
                      status: "joined",
                      updated_at: "2026-03-24T12:00:00.000Z",
                    },
                    {
                      user_id: "user-2",
                      batch_id: "batch-2",
                      status: "cancelled",
                      updated_at: "2026-03-23T12:00:00.000Z",
                    },
                  ],
                  error: null,
                })),
              })),
            })),
          };
        }

        if (table === "match_batches") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(async () => ({
                data: [
                  { id: "batch-1", label: "第 1 轮" },
                  { id: "batch-2", label: "第 2 轮" },
                ],
                error: null,
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const result = await listAdminUsers(1);

    expect(result.total).toBe(2);
    expect(result.pageSize).toBe(50);
    expect(result.effectiveQuestionnaireVersionNo).toBe(3);
    expect(result.items[0]).toMatchObject({
      email: "user1@smail.nju.edu.cn",
      isAuthBanned: true,
      profileCompleted: true,
      questionnaireStatusLabel: "当前版本已提交",
      recentParticipationBatchLabel: "第 1 轮",
      recentParticipationStatus: "joined",
    });
    expect(result.items[1]).toMatchObject({
      accountStatus: "deleted",
      isAuthBanned: false,
      profileCompleted: false,
      questionnaireStatusLabel: "当前版本草稿未提交",
      recentParticipationBatchLabel: "第 2 轮",
      recentParticipationStatus: "cancelled",
    });
  });

  it("searches by auth email and nickname, then keeps created_at descending order", async () => {
    getEffectiveQuestionnaireContextMock.mockResolvedValue({
      batchId: "batch-1",
      batchStatus: "open",
      description: "desc",
      matchingPolicyJson: {},
      resultPublishAt: null,
      signupEndAt: null,
      source: "batch",
      title: "问卷",
      versionId: "version-1",
      versionNo: 3,
      versionStatus: "published",
      windowStatus: "open",
    });

    listUsersMock.mockResolvedValue({
      data: {
        users: [
          {
            id: "user-1",
            email: "hongli@njudate.cn",
          },
        ],
      },
      error: null,
    });

    const getUserByIdMock = vi.fn(async (userId: string) => ({
      data: {
        user: {
          email:
            userId === "user-1"
              ? "hongli@njudate.cn"
              : "guest@smail.nju.edu.cn",
          banned_until: null,
        },
      },
      error: null,
    }));

    createAdminSupabaseClientMock.mockReturnValue({
      auth: {
        admin: {
          getUserById: getUserByIdMock,
          listUsers: listUsersMock,
        },
      },
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return {
            select: vi.fn((columns: string, options?: { count?: "exact"; head?: boolean }) => {
              if (options?.head) {
                return Promise.resolve({
                  count: 2,
                  error: null,
                });
              }

              if (columns === "id") {
                return {
                  ilike: vi.fn(async () => ({
                    data: [{ id: "user-2" }],
                    error: null,
                  })),
                };
              }

              return {
                in: vi.fn(() => ({
                  order: vi.fn(() => ({
                    range: vi.fn(async () => ({
                      data: [
                        {
                          id: "user-1",
                          role: "admin",
                          account_status: "active",
                          nickname: "运营 Hong",
                          gender: "女",
                          grade: "研一",
                          department: "软件学院",
                          campus: "鼓楼校区",
                          birth_year: 2001,
                          deleted_at: null,
                          created_at: "2026-03-10T12:00:00.000Z",
                        },
                        {
                          id: "user-2",
                          role: "user",
                          account_status: "active",
                          nickname: "Hong 同学",
                          gender: "男",
                          grade: "大四",
                          department: "计算机学院",
                          campus: "仙林校区",
                          birth_year: 2000,
                          deleted_at: null,
                          created_at: "2026-03-08T12:00:00.000Z",
                        },
                      ],
                      error: null,
                    })),
                  })),
                })),
              };
            }),
          };
        }

        if (table === "questionnaire_submissions") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                in: vi.fn(() => ({
                  order: vi.fn(async () => ({
                    data: [
                      { user_id: "user-1", status: "submitted", submission_no: 2 },
                      { user_id: "user-2", status: "draft", submission_no: 1 },
                    ],
                    error: null,
                  })),
                })),
              })),
            })),
          };
        }

        if (table === "batch_participations") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                order: vi.fn(async () => ({
                  data: [],
                  error: null,
                })),
              })),
            })),
          };
        }

        if (table === "match_batches") {
          return {
            select: vi.fn(() => ({
              in: vi.fn(async () => ({
                data: [],
                error: null,
              })),
            })),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const result = await listAdminUsers(1, { keyword: "hong" });

    expect(listUsersMock).toHaveBeenCalledWith({ page: 1, perPage: 500 });
    expect(result.total).toBe(2);
    expect(result.items.map((item) => item.id)).toEqual(["user-1", "user-2"]);
    expect(result.items[0]).toMatchObject({
      email: "hongli@njudate.cn",
      role: "admin",
    });
    expect(result.items[1]).toMatchObject({
      nickname: "Hong 同学",
      role: "user",
    });
  });
});
