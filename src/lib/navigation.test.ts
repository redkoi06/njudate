import { describe, expect, it } from "vitest";

import { isAuthenticatedNavItemActive } from "@/lib/navigation";

describe("isAuthenticatedNavItemActive", () => {
  it("keeps the admin overview tab active only on the overview route", () => {
    expect(isAuthenticatedNavItemActive("/admin", "/admin")).toBe(true);
    expect(isAuthenticatedNavItemActive("/admin/announcements", "/admin")).toBe(false);
    expect(isAuthenticatedNavItemActive("/admin/users", "/admin")).toBe(false);
  });

  it("keeps nested admin sections active on their child routes", () => {
    expect(
      isAuthenticatedNavItemActive("/admin/questionnaires/import", "/admin/questionnaires"),
    ).toBe(true);
    expect(isAuthenticatedNavItemActive("/admin/batches/123", "/admin/batches")).toBe(true);
  });

  it("does not break nested user routes", () => {
    expect(isAuthenticatedNavItemActive("/app/matches/abc", "/app/matches")).toBe(true);
    expect(isAuthenticatedNavItemActive("/app/profile", "/app/matches")).toBe(false);
  });
});
