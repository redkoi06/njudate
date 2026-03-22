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

import { registerUserAction } from "@/features/app/actions";

type MockAuthUser = {
  email?: string | null;
  email_confirmed_at?: string | null;
};

function createRegisterFormData(email: string) {
  const formData = new FormData();
  formData.set("email", email);
  formData.set("password", "secret1");
  formData.set("confirmPassword", "secret1");
  return formData;
}

function getQueryParam(url: string, key: string) {
  const [, query = ""] = url.split("?");
  return new URLSearchParams(query).get(key);
}

async function captureRedirectUrl(formData: FormData) {
  await expect(registerUserAction(formData)).rejects.toThrow(/^REDIRECT:/);
  const redirectUrl = redirectMock.mock.lastCall?.[0];
  expect(typeof redirectUrl).toBe("string");
  return redirectUrl as string;
}

describe("registerUserAction", () => {
  const email = "student@smail.nju.edu.cn";
  const listUsersMock = vi.fn();
  const signUpMock = vi.fn();
  const resendMock = vi.fn();

  beforeEach(() => {
    redirectMock.mockClear();
    createServerSupabaseClientMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
    listUsersMock.mockReset();
    signUpMock.mockReset();
    resendMock.mockReset();

    createAdminSupabaseClientMock.mockReturnValue({
      auth: {
        admin: {
          listUsers: listUsersMock,
        },
      },
    });

    createServerSupabaseClientMock.mockResolvedValue({
      auth: {
        signUp: signUpMock,
        resend: resendMock,
      },
    });
  });

  it("redirects to sent state for an unregistered email", async () => {
    listUsersMock.mockResolvedValue({
      data: { users: [] },
      error: null,
    });
    signUpMock.mockResolvedValue({ error: null });

    const url = await captureRedirectUrl(createRegisterFormData(email));

    expect(getQueryParam(url, "email")).toBe(email);
    expect(getQueryParam(url, "sent")).toBe("1");
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(resendMock).not.toHaveBeenCalled();
  });

  it("shows registered message for a confirmed existing email", async () => {
    const users: MockAuthUser[] = [
      {
        email,
        email_confirmed_at: "2026-03-22T12:00:00Z",
      },
    ];
    listUsersMock.mockResolvedValue({
      data: { users },
      error: null,
    });

    const url = await captureRedirectUrl(createRegisterFormData(email));

    expect(getQueryParam(url, "email")).toBe(email);
    expect(getQueryParam(url, "error")).toBe("该邮箱已注册，请直接登录。");
    expect(signUpMock).not.toHaveBeenCalled();
    expect(resendMock).not.toHaveBeenCalled();
  });

  it("resends confirmation mail for an unconfirmed existing email", async () => {
    const users: MockAuthUser[] = [
      {
        email,
        email_confirmed_at: null,
      },
    ];
    listUsersMock.mockResolvedValue({
      data: { users },
      error: null,
    });
    resendMock.mockResolvedValue({ error: null });

    const url = await captureRedirectUrl(createRegisterFormData(email));

    expect(getQueryParam(url, "email")).toBe(email);
    expect(getQueryParam(url, "error")).toBe(
      "该邮箱已注册，确认邮件已重新发送，请查收邮箱完成确认。",
    );
    expect(resendMock).toHaveBeenCalledWith({
      type: "signup",
      email,
      options: {
        emailRedirectTo: "http://localhost:3000/auth/confirm",
      },
    });
    expect(signUpMock).not.toHaveBeenCalled();
  });

  it("shows resend failure message when resend request fails", async () => {
    const users: MockAuthUser[] = [
      {
        email,
        email_confirmed_at: null,
      },
    ];
    listUsersMock.mockResolvedValue({
      data: { users },
      error: null,
    });
    resendMock.mockResolvedValue({
      error: { message: "resend failed" },
    });

    const url = await captureRedirectUrl(createRegisterFormData(email));

    expect(getQueryParam(url, "email")).toBe(email);
    expect(getQueryParam(url, "error")).toBe(
      "该邮箱已注册，但确认邮件重发失败，请稍后再试。",
    );
    expect(signUpMock).not.toHaveBeenCalled();
  });
});
