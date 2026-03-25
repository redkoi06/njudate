import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAdminSupabaseClientMock } = vi.hoisted(() => ({
  createAdminSupabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

import {
  REGISTRATION_OPEN_DEFAULT,
  getRegistrationOpen,
  parseRegistrationOpenValue,
} from "@/lib/auth/registration";

describe("registration config", () => {
  beforeEach(() => {
    createAdminSupabaseClientMock.mockReset();
  });

  it("falls back to the default when config value is not a boolean", () => {
    expect(parseRegistrationOpenValue("true")).toBe(
      REGISTRATION_OPEN_DEFAULT,
    );
    expect(parseRegistrationOpenValue(null)).toBe(
      REGISTRATION_OPEN_DEFAULT,
    );
  });

  it("returns the configured boolean value", async () => {
    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { value_json: false },
              error: null,
            })),
          })),
        })),
      })),
    });

    await expect(getRegistrationOpen()).resolves.toBe(false);
  });
});
