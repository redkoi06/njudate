import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getCurrentSessionHomePathMock,
  getOptionalSessionUserMock,
  getRegistrationOpenMock,
  redirectMock,
} = vi.hoisted(() => ({
  getCurrentSessionHomePathMock: vi.fn(),
  getOptionalSessionUserMock: vi.fn(),
  getRegistrationOpenMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: (props: Record<string, unknown>) => <img alt="" {...props} />,
}));

vi.mock("@/lib/auth/session", () => ({
  getCurrentSessionHomePath: getCurrentSessionHomePathMock,
  getOptionalSessionUser: getOptionalSessionUserMock,
}));

vi.mock("@/lib/auth/registration", () => ({
  getRegistrationOpen: getRegistrationOpenMock,
}));

vi.mock("@/features/app/actions", () => ({
  signInWithPasswordAction: vi.fn(),
}));

vi.mock("@/app/login/user-agreement-dialog", () => ({
  UserAgreementDialog: () => <span>协议</span>,
}));

import LoginPage from "@/app/login/page";

describe("LoginPage", () => {
  beforeEach(() => {
    getCurrentSessionHomePathMock.mockReset();
    getOptionalSessionUserMock.mockReset();
    getRegistrationOpenMock.mockReset();
    redirectMock.mockClear();
    getOptionalSessionUserMock.mockResolvedValue(null);
    getRegistrationOpenMock.mockResolvedValue(true);
  });

  it("keeps the register link clickable when registration is open", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("link", { name: "立即注册" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("renders a non-clickable register entry when registration is closed", async () => {
    getRegistrationOpenMock.mockResolvedValue(false);

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("立即注册")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "立即注册" }),
    ).not.toBeInTheDocument();
  });
});
