import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  createServerSupabaseClientMock,
  createAdminSupabaseClientMock,
  getRegistrationOpenMock,
  revalidatePathMock,
  sendTransactionalEmailMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  createServerSupabaseClientMock: vi.fn(),
  createAdminSupabaseClientMock: vi.fn(),
  getRegistrationOpenMock: vi.fn(),
  revalidatePathMock: vi.fn(),
  sendTransactionalEmailMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("@/lib/env/client", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  }),
}));

vi.mock("@/features/app/data", () => ({
  getQuestionnaireState: vi.fn(),
}));

vi.mock("@/lib/email/send", () => ({
  sendTransactionalEmail: sendTransactionalEmailMock,
}));

vi.mock("@/lib/auth/registration", () => ({
  getRegistrationOpen: getRegistrationOpenMock,
}));

import {
  deleteOwnAccountAction,
  markNotificationReadAction,
  signInWithPasswordAction,
  triggerMatchContactAction,
} from "@/features/app/actions";

const VALID_MATCH_RESULT_ID = "33333333-3333-4333-8333-333333333333";
const VALID_MATCH_PAIR_ID = "44444444-4444-4444-8444-444444444444";
const VALID_BATCH_ID = "55555555-5555-4555-8555-555555555555";
const VALID_NOTIFICATION_ID = "66666666-6666-4666-8666-666666666666";

function getQueryParam(url: string, key: string) {
  const [, query = ""] = url.split("?");
  return new URLSearchParams(query).get(key);
}

function createAppUsersTableBuilder(data: Record<string, unknown> | null) {
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

function createMaybeSingleBuilder(data: Record<string, unknown> | null) {
  const maybeSingleMock = vi.fn().mockResolvedValue({
    data,
    error: null,
  });

  return {
    builder: {
      maybeSingle: maybeSingleMock,
    },
    maybeSingleMock,
  };
}

function createSingleBuilder(data: Record<string, unknown>) {
  const singleMock = vi.fn().mockResolvedValue({
    data,
    error: null,
  });

  return {
    builder: {
      single: singleMock,
    },
    singleMock,
  };
}

async function captureRedirect(action: Promise<unknown>) {
  await expect(action).rejects.toThrow(/^REDIRECT:/);
  const redirectUrl = redirectMock.mock.lastCall?.[0];
  expect(typeof redirectUrl).toBe("string");
  return redirectUrl as string;
}

async function flushMicrotasks() {
  await Promise.resolve();
  await Promise.resolve();
}

describe("account actions", () => {
  const deleteActionUserId = "11111111-1111-4111-8111-111111111111";
  const cancelledParticipationId = "22222222-2222-4222-8222-222222222222";
  const signInWithPasswordMock = vi.fn();
  const signOutMock = vi.fn();
  const getUserMock = vi.fn();
  const updateUserByIdMock = vi.fn();
  const rpcMock = vi.fn();
  const adminRpcMock = vi.fn();
  const operationLogsInsertMock = vi.fn();
  const serverAppUsers = createAppUsersTableBuilder({
    role: "user",
    account_status: "active",
    deleted_at: null,
  });

  beforeEach(() => {
    redirectMock.mockClear();
    createServerSupabaseClientMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
    getRegistrationOpenMock.mockReset();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();
    getUserMock.mockReset();
    updateUserByIdMock.mockReset();
    rpcMock.mockReset();
    adminRpcMock.mockReset();
    operationLogsInsertMock.mockReset();
    revalidatePathMock.mockReset();
    sendTransactionalEmailMock.mockReset();
    serverAppUsers.selectMock.mockClear();
    serverAppUsers.eqMock.mockClear();
    serverAppUsers.maybeSingleMock.mockResolvedValue({
      data: {
        role: "user",
        account_status: "active",
        deleted_at: null,
      },
      error: null,
    });

    getRegistrationOpenMock.mockResolvedValue(true);
    sendTransactionalEmailMock.mockResolvedValue({
      ok: true,
    });
    adminRpcMock.mockImplementation(async (fn: string) => {
      if (fn === "lookup_auth_user_by_email") {
        return {
          data: [],
          error: null,
        };
      }

      return {
        data: null,
        error: null,
      };
    });

    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        getUser: getUserMock,
        signInWithPassword: signInWithPasswordMock,
        signOut: signOutMock,
      },
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return serverAppUsers.builder;
        }

        throw new Error(`Unexpected server table: ${table}`);
      }),
      rpc: rpcMock,
    });

    createAdminSupabaseClientMock.mockReturnValue({
      auth: {
        admin: {
          updateUserById: updateUserByIdMock,
        },
      },
      rpc: adminRpcMock,
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return createAppUsersTableBuilder({
            account_status: "active",
          }).builder;
        }

        if (table === "operation_logs") {
          return {
            insert: operationLogsInsertMock.mockResolvedValue({
              error: null,
            }),
          };
        }

        throw new Error(`Unexpected admin table: ${table}`);
      }),
    });
  });

  it("blocks sign-in for a deleted account before password verification", async () => {
    const formData = new FormData();
    formData.set("email", "deleted@smail.nju.edu.cn");
    formData.set("password", "secret1");

    adminRpcMock.mockResolvedValue({
      data: [
        {
          email_confirmed_at: "2026-03-22T12:00:00Z",
          user_id: "user-1",
        },
      ],
      error: null,
    });

    createAdminSupabaseClientMock.mockReturnValue({
      auth: {
        admin: {
          updateUserById: updateUserByIdMock,
        },
      },
      rpc: adminRpcMock,
      from: vi.fn(
        () => createAppUsersTableBuilder({ account_status: "deleted" }).builder,
      ),
    });

    const redirectUrl = await captureRedirect(
      signInWithPasswordAction(formData),
    );

    expect(getQueryParam(redirectUrl, "error")).toBe("账号已删除，无法登录。");
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
  });

  it("allows a staff domain to continue through the login action", async () => {
    const formData = new FormData();
    formData.set("email", "admin@njudate.cn");
    formData.set("password", "secret1");

    adminRpcMock.mockResolvedValue({
      data: [],
      error: null,
    });
    signInWithPasswordMock.mockResolvedValue({
      data: {
        user: {
          id: "staff-user-1",
        },
      },
      error: null,
    });

    const redirectUrl = await captureRedirect(
      signInWithPasswordAction(formData),
    );

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "admin@njudate.cn",
      password: "secret1",
    });
    expect(redirectUrl).toBe("/app");
  });

  it("redirects back to settings when account deletion is rejected", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      error: {
        message: "当前轮次已锁定或正在处理中，请等待结果发布后再删除账号。",
      },
    });

    const redirectUrl = await captureRedirect(deleteOwnAccountAction());

    expect(getQueryParam(redirectUrl, "accountError")).toBe(
      "当前轮次已锁定或正在处理中，请等待结果发布后再删除账号。",
    );
    expect(updateUserByIdMock).not.toHaveBeenCalled();
    expect(signOutMock).not.toHaveBeenCalled();
  });

  it("soft-deletes, bans and signs out the current user", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      data: {
        userId: deleteActionUserId,
        cancelledParticipationIds: [],
      },
      error: null,
    });
    updateUserByIdMock.mockResolvedValue({
      data: null,
      error: null,
    });
    signOutMock.mockResolvedValue({
      error: null,
    });

    const redirectUrl = await captureRedirect(deleteOwnAccountAction());

    expect(rpcMock).toHaveBeenCalledWith("delete_my_account");
    expect(updateUserByIdMock).toHaveBeenCalledWith(deleteActionUserId, {
      ban_duration: "876000h",
    });
    expect(adminRpcMock).not.toHaveBeenCalled();
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(redirectUrl).toBe("/");
  });

  it("rolls back deletion when auth ban fails", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      data: {
        userId: deleteActionUserId,
        cancelledParticipationIds: [cancelledParticipationId],
      },
      error: null,
    });
    updateUserByIdMock.mockResolvedValue({
      data: null,
      error: {
        message: "ban failed",
      },
    });
    adminRpcMock.mockResolvedValue({
      data: deleteActionUserId,
      error: null,
    });
    signOutMock.mockResolvedValue({
      error: null,
    });

    const redirectUrl = await captureRedirect(deleteOwnAccountAction());

    expect(adminRpcMock).toHaveBeenCalledWith("rollback_delete_my_account", {
      p_user_id: deleteActionUserId,
      p_cancelled_participation_ids: [cancelledParticipationId],
    });
    expect(operationLogsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "account_delete_rolled_back_after_auth_ban_failure",
        actor_role: "system",
        entity_id: deleteActionUserId,
      }),
    );
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(redirectUrl).toBe("/");
  });

  it("logs rollback failure and still signs out when auth ban rollback fails", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      data: {
        userId: deleteActionUserId,
        cancelledParticipationIds: [cancelledParticipationId],
      },
      error: null,
    });
    updateUserByIdMock.mockResolvedValue({
      data: null,
      error: {
        message: "ban failed",
      },
    });
    adminRpcMock.mockResolvedValue({
      data: null,
      error: {
        message: "rollback failed",
      },
    });
    signOutMock.mockResolvedValue({
      error: null,
    });

    const redirectUrl = await captureRedirect(deleteOwnAccountAction());

    expect(adminRpcMock).toHaveBeenCalledWith("rollback_delete_my_account", {
      p_user_id: deleteActionUserId,
      p_cancelled_participation_ids: [cancelledParticipationId],
    });
    expect(operationLogsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "account_delete_rollback_failed",
        actor_role: "system",
        entity_id: deleteActionUserId,
      }),
    );
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(redirectUrl).toBe("/");
  });

  it("keeps the user on the current match detail page after triggering contact", async () => {
    const matchResultId = VALID_MATCH_RESULT_ID;
    const matchPairId = VALID_MATCH_PAIR_ID;
    const matchResultLookup = createMaybeSingleBuilder({
      batch_id: VALID_BATCH_ID,
    });
    const batchLookup = createSingleBuilder({
      round_no: 6,
      status: "published",
    });
    const notificationInsertSingleMock = vi
      .fn()
      .mockResolvedValueOnce({
        data: { id: VALID_NOTIFICATION_ID },
        error: null,
      })
      .mockResolvedValueOnce({
        data: { id: "77777777-7777-4777-8777-777777777777" },
        error: null,
      });
    const existingNotificationLookup = createMaybeSingleBuilder({
      id: VALID_NOTIFICATION_ID,
    });
    const notificationSelectEqSourceIdMock = vi
      .fn()
      .mockReturnValue(existingNotificationLookup.builder);
    const notificationSelectEqSourceTypeMock = vi.fn().mockReturnValue({
      eq: notificationSelectEqSourceIdMock,
    });
    const notificationSelectEqUserIdMock = vi.fn().mockReturnValue({
      eq: notificationSelectEqSourceTypeMock,
    });
    const notificationSelectMock = vi.fn().mockReturnValue({
      single: notificationInsertSingleMock,
      eq: notificationSelectEqUserIdMock,
    });
    const notificationInsertMock = vi.fn().mockReturnValue({
      select: notificationSelectMock,
    });
    const notificationUpdateEqMock = vi
      .fn()
      .mockResolvedValue({ error: null });
    const notificationUpdateMock = vi.fn().mockReturnValue({
      eq: notificationUpdateEqMock,
    });

    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      data: {
        left_user: {
          user_id: deleteActionUserId,
          nickname: "当前用户",
          email: "self@smail.nju.edu.cn",
        },
        right_user: {
          user_id: "other-user-1",
          nickname: "对方用户",
          email: "other@smail.nju.edu.cn",
        },
      },
      error: null,
    });
    adminRpcMock.mockImplementation(async (fn: string) => {
      if (fn === "claim_match_contact_notification_email") {
        return {
          data: true,
          error: null,
        };
      }

      return {
        data: null,
        error: null,
      };
    });
    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        getUser: getUserMock,
        signInWithPassword: signInWithPasswordMock,
        signOut: signOutMock,
      },
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return serverAppUsers.builder;
        }

        if (table === "match_results") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue(matchResultLookup.builder),
                }),
              }),
            }),
          };
        }

        if (table === "match_batches") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue(batchLookup.builder),
            }),
          };
        }

        throw new Error(`Unexpected server table: ${table}`);
      }),
      rpc: rpcMock,
    });
    createAdminSupabaseClientMock.mockReturnValue({
      rpc: adminRpcMock,
      from: vi.fn((table: string) => {
        if (table === "notifications") {
          return {
            insert: notificationInsertMock,
            select: notificationSelectMock,
            update: notificationUpdateMock,
          };
        }

        throw new Error(`Unexpected admin table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set("matchPairId", matchPairId);
    formData.set("matchResultId", matchResultId);

    const redirectUrl = await captureRedirect(
      triggerMatchContactAction(formData),
    );
    await flushMicrotasks();

    expect(rpcMock).toHaveBeenCalledWith("trigger_match_contact", {
      p_match_pair_id: matchPairId,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/matches");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      `/app/matches/${matchResultId}`,
    );
    expect(redirectUrl).toBe(`/app/matches/${matchResultId}`);
    expect(notificationInsertMock).toHaveBeenCalledTimes(2);
    expect(notificationInsertMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        title: "第 6 轮联系方式已开放",
        body: "你与 对方用户 的联系方式已开放，可以通过校内邮箱继续交流。",
      }),
    );
    expect(notificationInsertMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        title: "第 6 轮联系方式已开放",
        body: "你与 当前用户 的联系方式已开放，可以通过校内邮箱继续交流。",
      }),
    );
    expect(notificationUpdateEqMock).toHaveBeenCalledTimes(2);
    expect(adminRpcMock).toHaveBeenCalledTimes(2);
    expect(adminRpcMock).toHaveBeenNthCalledWith(
      1,
      "claim_match_contact_notification_email",
      expect.objectContaining({
        p_notification_id: VALID_NOTIFICATION_ID,
      }),
    );
    expect(sendTransactionalEmailMock).toHaveBeenCalledTimes(2);
    expect(sendTransactionalEmailMock).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        subject: "第 6 轮联系方式已开放",
      }),
    );
    expect(sendTransactionalEmailMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        subject: "第 6 轮联系方式已开放",
      }),
    );
  });

  it("does not resend contact notifications when the records already exist", async () => {
    const matchResultId = VALID_MATCH_RESULT_ID;
    const matchPairId = VALID_MATCH_PAIR_ID;
    const matchResultLookup = createMaybeSingleBuilder({
      batch_id: VALID_BATCH_ID,
    });
    const batchLookup = createSingleBuilder({
      round_no: 6,
      status: "published",
    });
    const notificationInsertSingleMock = vi
      .fn()
      .mockResolvedValue({
        data: null,
        error: {
          code: "23505",
          message: "duplicate key value violates unique constraint",
        },
      });
    const existingNotificationLookup = createMaybeSingleBuilder({
      id: VALID_NOTIFICATION_ID,
    });
    const notificationSelectEqSourceIdMock = vi
      .fn()
      .mockReturnValue(existingNotificationLookup.builder);
    const notificationSelectEqSourceTypeMock = vi.fn().mockReturnValue({
      eq: notificationSelectEqSourceIdMock,
    });
    const notificationSelectEqUserIdMock = vi.fn().mockReturnValue({
      eq: notificationSelectEqSourceTypeMock,
    });
    const notificationSelectMock = vi.fn().mockReturnValue({
      single: notificationInsertSingleMock,
      eq: notificationSelectEqUserIdMock,
    });
    const notificationInsertMock = vi.fn().mockReturnValue({
      select: notificationSelectMock,
    });
    const notificationUpdateEqMock = vi
      .fn()
      .mockResolvedValue({ error: null });
    const notificationUpdateMock = vi.fn().mockReturnValue({
      eq: notificationUpdateEqMock,
    });

    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      data: {
        left_user: {
          user_id: deleteActionUserId,
          nickname: "当前用户",
          email: "self@smail.nju.edu.cn",
        },
        right_user: {
          user_id: "other-user-1",
          nickname: "对方用户",
          email: "other@smail.nju.edu.cn",
        },
      },
      error: null,
    });
    adminRpcMock.mockImplementation(async (fn: string) => {
      if (fn === "claim_match_contact_notification_email") {
        return {
          data: false,
          error: null,
        };
      }

      return {
        data: null,
        error: null,
      };
    });
    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        getUser: getUserMock,
        signInWithPassword: signInWithPasswordMock,
        signOut: signOutMock,
      },
      from: vi.fn((table: string) => {
        if (table === "app_users") {
          return serverAppUsers.builder;
        }

        if (table === "match_results") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  not: vi.fn().mockReturnValue(matchResultLookup.builder),
                }),
              }),
            }),
          };
        }

        if (table === "match_batches") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue(batchLookup.builder),
            }),
          };
        }

        throw new Error(`Unexpected server table: ${table}`);
      }),
      rpc: rpcMock,
    });
    createAdminSupabaseClientMock.mockReturnValue({
      rpc: adminRpcMock,
      from: vi.fn((table: string) => {
        if (table === "notifications") {
          return {
            insert: notificationInsertMock,
            select: notificationSelectMock,
            update: notificationUpdateMock,
          };
        }

        throw new Error(`Unexpected admin table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set("matchPairId", matchPairId);
    formData.set("matchResultId", matchResultId);

    const redirectUrl = await captureRedirect(
      triggerMatchContactAction(formData),
    );
    await flushMicrotasks();

    expect(redirectUrl).toBe(`/app/matches/${matchResultId}`);
    expect(notificationInsertMock).toHaveBeenCalledTimes(2);
    expect(notificationSelectEqUserIdMock).toHaveBeenCalledTimes(2);
    expect(adminRpcMock).toHaveBeenCalledTimes(2);
    expect(notificationUpdateEqMock).not.toHaveBeenCalled();
    expect(sendTransactionalEmailMock).not.toHaveBeenCalled();
  });

  it("marks a notification as read and revalidates the dashboard", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      data: VALID_NOTIFICATION_ID,
      error: null,
    });

    const formData = new FormData();
    formData.set("notificationId", VALID_NOTIFICATION_ID);

    const redirectUrl = await captureRedirect(
      markNotificationReadAction(formData),
    );

    expect(rpcMock).toHaveBeenCalledWith("mark_notification_read", {
      p_notification_id: VALID_NOTIFICATION_ID,
    });
    expect(redirectUrl).toBe("/app/dashboard");
  });
});
