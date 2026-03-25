import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  createServerSupabaseClientMock,
  createAdminSupabaseClientMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  createServerSupabaseClientMock: vi.fn(),
  createAdminSupabaseClientMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
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
  sendTransactionalEmail: vi.fn(),
}));

import {
  deleteOwnAccountAction,
  markNotificationReadAction,
  signInWithPasswordAction,
} from "@/features/app/actions";

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

async function captureRedirect(action: Promise<unknown>) {
  await expect(action).rejects.toThrow(/^REDIRECT:/);
  const redirectUrl = redirectMock.mock.lastCall?.[0];
  expect(typeof redirectUrl).toBe("string");
  return redirectUrl as string;
}

describe("account actions", () => {
  const deleteActionUserId = "11111111-1111-4111-8111-111111111111";
  const cancelledParticipationId = "22222222-2222-4222-8222-222222222222";
  const listUsersMock = vi.fn();
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
    listUsersMock.mockReset();
    signInWithPasswordMock.mockReset();
    signOutMock.mockReset();
    getUserMock.mockReset();
    updateUserByIdMock.mockReset();
    rpcMock.mockReset();
    adminRpcMock.mockReset();
    operationLogsInsertMock.mockReset();
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
          listUsers: listUsersMock,
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

    listUsersMock.mockResolvedValue({
      data: {
        users: [
          {
            email: "deleted@smail.nju.edu.cn",
            email_confirmed_at: "2026-03-22T12:00:00Z",
            id: "user-1",
          },
        ],
      },
      error: null,
    });

    createAdminSupabaseClientMock.mockReturnValue({
      auth: {
        admin: {
          listUsers: listUsersMock,
          updateUserById: updateUserByIdMock,
        },
      },
      from: vi.fn(() => createAppUsersTableBuilder({ account_status: "deleted" }).builder),
    });

    const redirectUrl = await captureRedirect(signInWithPasswordAction(formData));

    expect(getQueryParam(redirectUrl, "error")).toBe("账号已删除，无法登录。");
    expect(signInWithPasswordMock).not.toHaveBeenCalled();
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

  it("marks a notification as read and revalidates the dashboard", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: deleteActionUserId,
        },
      },
    });
    rpcMock.mockResolvedValue({
      data: "notification-1",
      error: null,
    });

    const formData = new FormData();
    formData.set("notificationId", "notification-1");

    const redirectUrl = await captureRedirect(markNotificationReadAction(formData));

    expect(rpcMock).toHaveBeenCalledWith("mark_notification_read", {
      p_notification_id: "notification-1",
    });
    expect(redirectUrl).toBe("/app/dashboard");
  });
});
