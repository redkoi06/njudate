import React from "react";
import { act, render, screen, waitFor } from "@testing-library/react";
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
  function getPasswordInput() {
    return screen.getByLabelText(/新密码/, {
      selector: 'input[name="password"]',
    });
  }

  function getConfirmPasswordInput() {
    return screen.getByLabelText(/确认新密码/, {
      selector: 'input[name="confirmPassword"]',
    });
  }

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

    await waitFor(() => {
      expect(getPasswordInput()).toBeInTheDocument();
    });

    await user.type(getPasswordInput(), "secret1");
    await user.type(getConfirmPasswordInput(), "secret1");
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

    await waitFor(() => {
      expect(getPasswordInput()).toBeInTheDocument();
    });

    await user.type(getPasswordInput(), "secret1");
    await user.type(getConfirmPasswordInput(), "secret2");

    expect(screen.getByRole("button", { name: "更新密码" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent("两次输入的密码不一致");
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("shows an invalid-link state when no recovery session becomes available", async () => {
    vi.useFakeTimers();

    try {
      getSessionMock.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      render(React.createElement(ResetPasswordForm));

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1300);
      });

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(screen.getByText("无法重置密码")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "返回登录页" })).toHaveAttribute(
        "href",
        "/login",
      );
    } finally {
      vi.useRealTimers();
    }
  });
});
