import { readFileSync } from "node:fs";
import { join } from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  redirectMock,
  revalidatePathMock,
  requireAdminUserMock,
  createAdminSupabaseClientMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  revalidatePathMock: vi.fn(),
  requireAdminUserMock: vi.fn(),
  createAdminSupabaseClientMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/auth/session", () => ({
  requireAdminUser: requireAdminUserMock,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminSupabaseClient: createAdminSupabaseClientMock,
}));

vi.mock("server-only", () => ({}));

import { updateMatchScheduleTextAction } from "@/features/admin/configs/actions";
import { getMatchScheduleConfig } from "@/features/admin/configs/data";
import { getRegistrationOpenConfig } from "@/features/admin/configs/data";
import { MATCH_SCHEDULE_TEXT } from "@/lib/site";

async function captureRedirect(action: Promise<unknown>) {
  await expect(action).rejects.toThrow(/^REDIRECT:/);
  const redirectUrl = redirectMock.mock.lastCall?.[0];
  expect(typeof redirectUrl).toBe("string");
  return redirectUrl as string;
}

describe("admin configs", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockClear();
    requireAdminUserMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
    requireAdminUserMock.mockResolvedValue({
      id: "admin-1",
    });
  });

  it("falls back to the default match schedule text when config is absent", async () => {
    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    });

    const config = await getMatchScheduleConfig();

    expect(config.key).toBe("match_schedule_text");
    expect(config.value).toBe(MATCH_SCHEDULE_TEXT);
  });

  it("falls back to open registration when config is absent", async () => {
    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: null,
              error: null,
            })),
          })),
        })),
      })),
    });

    const config = await getRegistrationOpenConfig();

    expect(config.key).toBe("registration_open");
    expect(config.value).toBe(true);
  });

  it("updates match_schedule_text through upsert only", async () => {
    const upsertMock = vi.fn(async () => ({
      error: null,
    }));
    const insertLogMock = vi.fn(async () => ({
      error: null,
    }));

    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "app_configs") {
          return {
            upsert: upsertMock,
          };
        }

        if (table === "operation_logs") {
          return {
            insert: insertLogMock,
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const formData = new FormData();
    formData.set("value", "每周四 19:30 由管理员手动公布结果");

    const redirectUrl = await captureRedirect(updateMatchScheduleTextAction(formData));

    expect(redirectUrl).toBe("/admin/configs");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config_key: "match_schedule_text",
        value_json: "每周四 19:30 由管理员手动公布结果",
      }),
      {
        onConflict: "config_key",
      },
    );
    expect(insertLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "config_updated",
        entity_id: "match_schedule_text",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/configs");
    expect(revalidatePathMock).toHaveBeenCalledWith("/login");
    expect(revalidatePathMock).toHaveBeenCalledWith("/register");
  });

  it("updates registration_open through upsert only", async () => {
    const upsertMock = vi.fn(async () => ({
      error: null,
    }));
    const insertLogMock = vi.fn(async () => ({
      error: null,
    }));

    createAdminSupabaseClientMock.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "app_configs") {
          return {
            upsert: upsertMock,
          };
        }

        if (table === "operation_logs") {
          return {
            insert: insertLogMock,
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const { updateRegistrationOpenAction } = await import(
      "@/features/admin/configs/actions"
    );
    const formData = new FormData();
    formData.set("registrationOpen", "on");

    const redirectUrl = await captureRedirect(updateRegistrationOpenAction(formData));

    expect(redirectUrl).toBe("/admin/configs");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        config_key: "registration_open",
        value_json: true,
      }),
      {
        onConflict: "config_key",
      },
    );
    expect(insertLogMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action_type: "config_updated",
        entity_id: "registration_open",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/configs");
    expect(revalidatePathMock).toHaveBeenCalledWith("/login");
    expect(revalidatePathMock).toHaveBeenCalledWith("/register");
  });

  it("keeps only the intended obsolete config cleanup in the migration contract", () => {
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260325030000_cleanup_obsolete_app_configs.sql",
    );
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("weekly_participation_open");
    expect(sql).toContain("repeat_match_cooldown_days");
    expect(sql).toContain("feature_flags");
    expect(sql).not.toContain("allowed_email_domains");
  });

  it("keeps the auth domain whitelist migration scoped to student and staff domains", () => {
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20260325040000_allow_njudate_auth_domain.sql",
    );
    const sql = readFileSync(migrationPath, "utf8");

    expect(sql).toContain("allowed_email_domains");
    expect(sql).toContain("smail.nju.edu.cn");
    expect(sql).toContain("njudate.cn");
  });
});
