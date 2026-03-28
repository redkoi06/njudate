import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getSessionMock,
  onAuthStateChangeMock,
  updateUserMock,
  replaceMock,
} = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
  onAuthStateChangeMock: vi.fn(),
  updateUserMock: vi.fn(),
  replaceMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: {
      getSession: getSessionMock,
      onAuthStateChange: onAuthStateChangeMock,
      updateUser: updateUserMock,
    },
  }),
}));

import { ResetPasswordForm } from "@/app/reset-password/reset-password-form";

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    getSessionMock.mockReset();
    onAuthStateChangeMock.mockReset();
    updateUserMock.mockReset();
    replaceMock.mockReset();

    onAuthStateChangeMock.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });
  });

  it("updates the password and redirects to the app when recovery session is ready", async () => {
    const user = userEvent.setup();

    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });
    updateUserMock.mockResolvedValue({ error: null });

    render(React.createElement(ResetPasswordForm));

    await screen.findByLabelText("新密码");

    await user.type(screen.getByLabelText("新密码"), "secret1");
    await user.type(screen.getByLabelText("确认新密码"), "secret1");
    await user.click(screen.getByRole("button", { name: "更新密码" }));

    await waitFor(() => {
      expect(updateUserMock).toHaveBeenCalledWith({ password: "secret1" });
    });
    expect(replaceMock).toHaveBeenCalledWith("/app");
  });

  it("prevents submission when the confirmation password does not match", async () => {
    const user = userEvent.setup();

    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: "user-1" } } },
      error: null,
    });

    render(React.createElement(ResetPasswordForm));

    await screen.findByLabelText("新密码");

    await user.type(screen.getByLabelText("新密码"), "secret1");
    await user.type(screen.getByLabelText("确认新密码"), "secret2");

    expect(screen.getByRole("button", { name: "更新密码" })).toBeDisabled();
    expect(screen.getByText("两次输入的密码不一致")).toBeInTheDocument();
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("shows an invalid-link state when no recovery session becomes available", async () => {
    vi.useFakeTimers();

    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(React.createElement(ResetPasswordForm));

    await vi.advanceTimersByTimeAsync(1300);

    expect(screen.getByText("无法重置密码")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "返回登录页" }),
    ).toHaveAttribute("href", "/login");

    vi.useRealTimers();
  });
});
