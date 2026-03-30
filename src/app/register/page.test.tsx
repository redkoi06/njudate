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
  registerUserAction: vi.fn(),
}));

vi.mock("@/app/register/register-form", () => ({
  RegisterForm: () => <div>register-form</div>,
}));

import RegisterPage from "@/app/register/page";

describe("RegisterPage", () => {
  beforeEach(() => {
    getCurrentSessionHomePathMock.mockReset();
    getOptionalSessionUserMock.mockReset();
    getRegistrationOpenMock.mockReset();
    redirectMock.mockClear();
    getOptionalSessionUserMock.mockResolvedValue(null);
    getRegistrationOpenMock.mockResolvedValue(true);
  });

  it("renders the register form when registration is open", async () => {
    render(await RegisterPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText("register-form")).toBeInTheDocument();
  });

  it("redirects to login when registration is closed", async () => {
    getRegistrationOpenMock.mockResolvedValue(false);

    await expect(
      RegisterPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow("REDIRECT:/login");
  });
});
