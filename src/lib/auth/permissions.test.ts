import { describe, expect, it } from "vitest";

import { canAccessAdminConsole } from "@/lib/auth/permissions";

describe("canAccessAdminConsole", () => {
  it("allows admin role", () => {
    expect(canAccessAdminConsole("admin")).toBe(true);
  });

  it("rejects normal user role", () => {
    expect(canAccessAdminConsole("user")).toBe(false);
  });
});
