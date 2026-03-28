import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const { resetPasswordForEmailMock } = vi.hoisted(() => ({
  resetPasswordForEmailMock: vi.fn(),
}));

vi.mock("@/lib/env/client", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      resetPasswordForEmail: resetPasswordForEmailMock,
    },
  }),
}));

vi.mock("@/app/login/user-agreement-dialog", () => ({
  UserAgreementDialog: () => <span>协议</span>,
}));

import { LoginForm } from "@/app/login/login-form";

describe("LoginForm", () => {
  it("renders the forgot password entry on the password label row and expands the inline panel", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(LoginForm, {
        action: vi.fn(),
        initialEmail: "",
        registrationOpen: true,
      }),
    );

    expect(
      screen.getByRole("button", { name: "忘记密码？" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("发送密码重置邮件"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "忘记密码？" }));

    expect(
      screen.getByRole("button", { name: "发送密码重置邮件" }),
    ).toBeVisible();
    expect(
      screen.getByText("将向您的邮箱发送密码重置邮件"),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("密码")).not.toBeInTheDocument();
    expect(screen.queryByText("登录即代表您已阅读并同意")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "登录" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "立即注册" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回登录" })).toBeVisible();
  });

  it("shows a validation error instead of sending when the email is invalid", async () => {
    const user = userEvent.setup();
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    render(
      React.createElement(LoginForm, {
        action: vi.fn(),
        initialEmail: "",
        registrationOpen: true,
      }),
    );

    await user.click(screen.getByRole("button", { name: "忘记密码？" }));
    await user.click(
      screen.getByRole("button", { name: "发送密码重置邮件" }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent("请输入有效邮箱");
    expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
  });

  it("sends a reset email for a valid email and shows success feedback", async () => {
    const user = userEvent.setup();
    resetPasswordForEmailMock.mockResolvedValue({ error: null });

    render(
      React.createElement(LoginForm, {
        action: vi.fn(),
        initialEmail: "student@smail.nju.edu.cn",
        registrationOpen: true,
      }),
    );

    await user.click(screen.getByRole("button", { name: "忘记密码？" }));
    await user.click(
      screen.getByRole("button", { name: "发送密码重置邮件" }),
    );

    await waitFor(() => {
      expect(resetPasswordForEmailMock).toHaveBeenCalledWith(
        "student@smail.nju.edu.cn",
        {
          redirectTo: "http://localhost:3000/reset-password",
        },
      );
    });

    expect(
      screen.getByText("如果账号存在，我们已发送重置邮件，请查收邮箱。"),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "发送密码重置邮件" }),
    ).not.toBeInTheDocument();
  });

  it("restores the login form after leaving forgot password mode", async () => {
    const user = userEvent.setup();

    render(
      React.createElement(LoginForm, {
        action: vi.fn(),
        initialEmail: "student@smail.nju.edu.cn",
        registrationOpen: true,
      }),
    );

    await user.click(screen.getByRole("button", { name: "忘记密码？" }));
    await user.click(screen.getByRole("button", { name: "返回登录" }));

    expect(screen.getByLabelText("密码")).toBeInTheDocument();
    expect(screen.getByText("登录即代表您已阅读并同意")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登录" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "立即注册" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "发送密码重置邮件" }),
    ).not.toBeInTheDocument();
  });
});
