import { beforeEach, describe, expect, it, vi } from "vitest";

const { redirectMock, createServerSupabaseClientMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  createServerSupabaseClientMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

function getRedirectUrl(error: unknown) {
  expect(error).toBeInstanceOf(Error);
  expect((error as Error).message).toMatch(/^REDIRECT:/);
  return (error as Error).message.replace(/^REDIRECT:/, "");
}

function createSupabaseClient(input: {
  appUserResults: Array<{
    data: { account_status: string | null; deleted_at: string | null; role: "admin" | "user" } | null;
    error: unknown;
  }>;
  rpcResult?: { error: unknown };
  user: { id: string } | null;
}) {
  const appUserResults = [...input.appUserResults];
  const maybeSingleMock = vi.fn(async () => {
    const nextResult = appUserResults.shift();

    return nextResult ?? { data: null, error: null };
  });
  const eqMock = vi.fn(() => ({
    maybeSingle: maybeSingleMock,
  }));
  const selectMock = vi.fn(() => ({
    eq: eqMock,
  }));
  const appUsersBuilder = {
    select: selectMock,
  };
  const getUserMock = vi.fn(async () => ({
    data: {
      user: input.user,
    },
  }));
  const signOutMock = vi.fn(async () => ({
    error: null,
  }));
  const rpcMock = vi.fn(async () => input.rpcResult ?? { error: null });
  const fromMock = vi.fn((table: string) => {
    if (table === "app_users") {
      return appUsersBuilder;
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    auth: {
      getUser: getUserMock,
      signOut: signOutMock,
    },
    from: fromMock,
    rpc: rpcMock,
  };
}

describe("session auth flow", () => {
  beforeEach(() => {
    vi.resetModules();
    redirectMock.mockClear();
    createServerSupabaseClientMock.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "test-publishable-key";
  });

  it("signs out and redirects to login when provisioning fails in requireSessionUser", async () => {
    const supabase = createSupabaseClient({
      appUserResults: [{ data: null, error: null }],
      rpcResult: {
        error: new Error("provision failed"),
      },
      user: { id: "user-1" },
    });

    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const { requireSessionUser } = await import("@/lib/auth/session");

    const redirectUrl = getRedirectUrl(
      await requireSessionUser().catch((error) => error),
    );

    expect(redirectUrl).toMatch(/^\/login\?error=/);
    expect(supabase.rpc).toHaveBeenCalledWith("provision_current_app_user");
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("redirects instead of throwing when provisioning fails in getCurrentSessionHomePath", async () => {
    const supabase = createSupabaseClient({
      appUserResults: [{ data: null, error: null }],
      rpcResult: {
        error: new Error("provision failed"),
      },
      user: { id: "user-2" },
    });

    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const { getCurrentSessionHomePath } = await import("@/lib/auth/session");

    const redirectUrl = getRedirectUrl(
      await getCurrentSessionHomePath().catch((error) => error),
    );

    expect(redirectUrl).toMatch(/^\/login\?error=/);
    expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);
  });

  it("returns the role home path after provisioning a missing app user", async () => {
    const supabase = createSupabaseClient({
      appUserResults: [
        { data: null, error: null },
        {
          data: {
            account_status: "active",
            deleted_at: null,
            role: "admin",
          },
          error: null,
        },
        {
          data: {
            account_status: "active",
            deleted_at: null,
            role: "admin",
          },
          error: null,
        },
      ],
      user: { id: "user-3" },
    });

    createServerSupabaseClientMock.mockResolvedValue(supabase);

    const { getCurrentSessionHomePath } = await import("@/lib/auth/session");

    await expect(getCurrentSessionHomePath()).resolves.toBe("/admin");
    expect(supabase.rpc).toHaveBeenCalledWith("provision_current_app_user");
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });
});
