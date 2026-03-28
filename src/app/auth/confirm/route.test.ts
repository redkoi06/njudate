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

  it("keeps the auth session cookie after successful confirmation", async () => {
    getRegistrationOpenMock.mockResolvedValue(true);

    createServerClientMock.mockImplementation((_url, _key, options) => ({
      auth: {
        verifyOtp: vi.fn(async () => {
          options.cookies.setAll([
            {
              name: "sb-test-auth-token",
              value: "session-token",
              options: {
                httpOnly: true,
                path: "/",
              },
            },
          ]);

          return { error: null };
        }),
        getUser: vi.fn(async () => ({
          data: {
            user: {
              id: "user-1",
            },
          },
        })),
      },
      rpc: vi.fn(async () => ({
        error: null,
      })),
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { role: "user" },
              error: null,
            })),
          })),
        })),
      })),
    }));

    const request = new NextRequest(
      "http://localhost:3000/auth/confirm?token_hash=test-token&type=email",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/app");
    expect(response.cookies.get("sb-test-auth-token")?.value).toBe(
      "session-token",
    );
  });

  it("accepts recovery links and redirects to the reset password page", async () => {
    getRegistrationOpenMock.mockResolvedValue(true);

    const verifyOtpMock = vi.fn(async ({ type }: { type: string }) => {
      expect(type).toBe("recovery");

      return { error: null };
    });
    const rpcMock = vi.fn();

    createServerClientMock.mockImplementation(() => ({
      auth: {
        verifyOtp: verifyOtpMock,
      },
      rpc: rpcMock,
    }));

    const request = new NextRequest(
      "http://localhost:3000/auth/confirm?token_hash=test-token&type=recovery&next=/reset-password",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/reset-password",
    );
    expect(verifyOtpMock).toHaveBeenCalledWith({
      token_hash: "test-token",
      type: "recovery",
    });
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("redirects recovery verification failures back to login", async () => {
    getRegistrationOpenMock.mockResolvedValue(true);

    createServerClientMock.mockImplementation(() => ({
      auth: {
        verifyOtp: vi.fn(async () => ({
          error: new Error("expired"),
        })),
      },
      rpc: vi.fn(),
    }));

    const request = new NextRequest(
      "http://localhost:3000/auth/confirm?token_hash=test-token&type=recovery&next=/reset-password",
    );

    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=%E9%87%8D%E7%BD%AE%E9%93%BE%E6%8E%A5%E6%97%A0%E6%95%88%E6%88%96%E5%B7%B2%E8%BF%87%E6%9C%9F%EF%BC%8C%E8%AF%B7%E9%87%8D%E6%96%B0%E5%8F%91%E9%80%81%E3%80%82",
    );
  });
});
