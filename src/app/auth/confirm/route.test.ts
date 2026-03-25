import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  createServerClientMock,
  getRegistrationOpenMock,
} = vi.hoisted(() => ({
  createServerClientMock: vi.fn(),
  getRegistrationOpenMock: vi.fn(),
}));

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@/lib/auth/registration", () => ({
  getRegistrationOpen: getRegistrationOpenMock,
}));

vi.mock("@/lib/env/client", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-publishable-key",
  }),
}));

import { GET } from "@/app/auth/confirm/route";

describe("auth confirm route", () => {
  beforeEach(() => {
    createServerClientMock.mockReset();
    getRegistrationOpenMock.mockReset();
  });

  it("redirects to login before consuming the token when registration is closed", async () => {
    const verifyOtpMock = vi.fn();
    const rpcMock = vi.fn();
    getRegistrationOpenMock.mockResolvedValue(false);
    createServerClientMock.mockReturnValue({
      auth: {
        verifyOtp: verifyOtpMock,
      },
      rpc: rpcMock,
    });

    const request = new NextRequest(
      "http://localhost:3000/auth/confirm?token_hash=test-token&type=email",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/login");
    expect(verifyOtpMock).not.toHaveBeenCalled();
    expect(rpcMock).not.toHaveBeenCalled();
  });
});
