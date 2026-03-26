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

import {
  archiveAnnouncementAction,
  publishAnnouncementAction,
  saveAnnouncementDraftAction,
} from "@/features/admin/announcements/actions";

const ANNOUNCEMENT_ID = "11111111-1111-4111-8111-111111111111";

type AnnouncementStatus = "draft" | "published" | "archived";
type AnnouncementRecord = {
  audience: "all" | "admin" | "public" | "user";
  body: string;
  ends_at: string;
  eyebrow: string;
  id: string;
  published_at: string | null;
  starts_at: string;
  status: AnnouncementStatus;
  title: string;
  archived_at?: string | null;
};

function createUpdateQuery(
  payload: Partial<AnnouncementRecord>,
  state: { announcements: AnnouncementRecord[] },
) {
  const filters = new Map<string, unknown>();

  const query = {
    eq(field: string, value: unknown) {
      filters.set(`eq:${field}`, value);
      return query;
    },
    neq(field: string, value: unknown) {
      filters.set(`neq:${field}`, value);
      return query;
    },
    then<TResult1, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: null; error: null }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      const id = filters.get("eq:id");
      const expectedStatus = filters.get("eq:status");
      const excludedStatus = filters.get("neq:status");

      const announcement = state.announcements.find((item) => item.id === id);
      if (
        announcement &&
        (expectedStatus === undefined || announcement.status === expectedStatus) &&
        (excludedStatus === undefined || announcement.status !== excludedStatus)
      ) {
        Object.assign(announcement, payload);
      }

      return Promise.resolve({ data: null, error: null }).then(onfulfilled, onrejected);
    },
  };

  return query;
}

function createAnnouncementsHarness(initialAnnouncements: AnnouncementRecord[]) {
  const state = {
    announcements: [...initialAnnouncements],
    logs: [] as Array<Record<string, unknown>>,
  };

  const adminClient = {
    from: vi.fn((table: string) => {
      if (table === "operation_logs") {
        return {
          insert: vi.fn(async (payload: Record<string, unknown>) => {
            state.logs.push(payload);
            return { error: null };
          }),
        };
      }

      if (table !== "announcements") {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        insert: (payload: Omit<AnnouncementRecord, "id">) => ({
          select: () => ({
            single: async () => {
              const createdId = `announcement-${state.announcements.length + 1}`;
              state.announcements.unshift({
                id: createdId,
                ...payload,
              });

              return {
                data: { id: createdId },
                error: null,
              };
            },
          }),
        }),
        select: () => ({
          eq: (_field: string, value: string) => ({
            maybeSingle: async () => ({
              data: state.announcements.find((item) => item.id === value) ?? null,
              error: null,
            }),
          }),
        }),
        update: (payload: Partial<AnnouncementRecord>) =>
          createUpdateQuery(payload, state),
      };
    }),
  };

  return { adminClient, state };
}

async function captureRedirect(action: Promise<unknown>) {
  await expect(action).rejects.toThrow(/^REDIRECT:/);
  const redirectUrl = redirectMock.mock.lastCall?.[0];
  expect(typeof redirectUrl).toBe("string");
  return redirectUrl as string;
}

function getRedirectQueryParam(url: string, key: string) {
  const [, query = ""] = url.split("?");
  return new URLSearchParams(query).get(key);
}

function buildAnnouncementFormData() {
  const formData = new FormData();
  formData.set("title", "春日公告");
  formData.set("eyebrow", "本周提醒");
  formData.set("audience", "all");
  formData.set("startsAt", "2026-03-25T12:00");
  formData.set("endsAt", "2026-03-26T12:00");
  formData.set("body", "请按时完成当前问卷。");
  return formData;
}

describe("announcement actions", () => {
  beforeEach(() => {
    redirectMock.mockClear();
    revalidatePathMock.mockClear();
    requireAdminUserMock.mockReset();
    createAdminSupabaseClientMock.mockReset();
    requireAdminUserMock.mockResolvedValue({
      id: "admin-1",
    });
  });

  it("creates a draft announcement", async () => {
    const harness = createAnnouncementsHarness([]);
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const redirectUrl = await captureRedirect(
      saveAnnouncementDraftAction(buildAnnouncementFormData()),
    );

    expect(redirectUrl).toBe("/admin/announcements");
    expect(harness.state.announcements).toHaveLength(1);
    expect(harness.state.announcements[0]?.status).toBe("draft");
    expect(harness.state.announcements[0]).toMatchObject({
      starts_at: "2026-03-25T04:00:00.000Z",
      ends_at: "2026-03-26T04:00:00.000Z",
    });
    expect(harness.state.logs).toContainEqual(
      expect.objectContaining({
        action_type: "announcement_created",
        actor_role: "admin",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin");
    expect(revalidatePathMock).toHaveBeenCalledWith("/admin/announcements");
    expect(revalidatePathMock).toHaveBeenCalledWith("/app/dashboard");
  });

  it("updates a draft announcement", async () => {
    const harness = createAnnouncementsHarness([
      {
        id: ANNOUNCEMENT_ID,
        title: "旧标题",
        eyebrow: "旧眉题",
        audience: "all",
        body: "旧内容",
        starts_at: "2026-03-24T12:00:00.000Z",
        ends_at: "2026-03-25T12:00:00.000Z",
        status: "draft",
        published_at: null,
      },
    ]);
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const formData = buildAnnouncementFormData();
    formData.set("announcementId", ANNOUNCEMENT_ID);

    const redirectUrl = await captureRedirect(saveAnnouncementDraftAction(formData));

    expect(redirectUrl).toBe("/admin/announcements");
    expect(harness.state.announcements[0]?.title).toBe("春日公告");
    expect(harness.state.logs).toContainEqual(
      expect.objectContaining({
        action_type: "announcement_updated",
        entity_id: ANNOUNCEMENT_ID,
      }),
    );
  });

  it("publishes a non-published announcement", async () => {
    const harness = createAnnouncementsHarness([
      {
        id: ANNOUNCEMENT_ID,
        title: "待发布",
        eyebrow: "提醒",
        audience: "user",
        body: "内容",
        starts_at: "2026-03-24T12:00:00.000Z",
        ends_at: "2026-03-26T12:00:00.000Z",
        status: "draft",
        published_at: null,
      },
    ]);
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const formData = new FormData();
    formData.set("announcementId", ANNOUNCEMENT_ID);

    const redirectUrl = await captureRedirect(publishAnnouncementAction(formData));

    expect(redirectUrl).toBe("/admin/announcements");
    expect(harness.state.announcements[0]?.status).toBe("published");
    expect(harness.state.announcements[0]?.published_at).toBeTruthy();
    expect(harness.state.logs).toContainEqual(
      expect.objectContaining({
        action_type: "announcement_published",
        entity_id: ANNOUNCEMENT_ID,
      }),
    );
  });

  it("archives a published announcement", async () => {
    const harness = createAnnouncementsHarness([
      {
        id: ANNOUNCEMENT_ID,
        title: "已发布",
        eyebrow: "提醒",
        audience: "user",
        body: "内容",
        starts_at: "2026-03-24T12:00:00.000Z",
        ends_at: "2026-03-26T12:00:00.000Z",
        status: "published",
        published_at: "2026-03-24T12:00:00.000Z",
      },
    ]);
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const formData = new FormData();
    formData.set("announcementId", ANNOUNCEMENT_ID);

    const redirectUrl = await captureRedirect(archiveAnnouncementAction(formData));

    expect(redirectUrl).toBe("/admin/announcements");
    expect(harness.state.announcements[0]?.status).toBe("archived");
    expect(harness.state.announcements[0]?.archived_at).toBeTruthy();
    expect(harness.state.logs).toContainEqual(
      expect.objectContaining({
        action_type: "announcement_archived",
        entity_id: ANNOUNCEMENT_ID,
      }),
    );
  });

  it("blocks editing for a published announcement", async () => {
    const harness = createAnnouncementsHarness([
      {
        id: ANNOUNCEMENT_ID,
        title: "已发布",
        eyebrow: "提醒",
        audience: "user",
        body: "内容",
        starts_at: "2026-03-24T12:00:00.000Z",
        ends_at: "2026-03-26T12:00:00.000Z",
        status: "published",
        published_at: "2026-03-24T12:00:00.000Z",
      },
    ]);
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const formData = buildAnnouncementFormData();
    formData.set("announcementId", ANNOUNCEMENT_ID);

    const redirectUrl = await captureRedirect(saveAnnouncementDraftAction(formData));

    expect(redirectUrl).toContain("/admin/announcements?error=");
    expect(harness.state.announcements[0]?.title).toBe("已发布");
    expect(harness.state.logs).toHaveLength(0);
  });

  it("blocks editing for an archived announcement", async () => {
    const harness = createAnnouncementsHarness([
      {
        id: ANNOUNCEMENT_ID,
        title: "已归档",
        eyebrow: "提醒",
        audience: "user",
        body: "内容",
        starts_at: "2026-03-24T12:00:00.000Z",
        ends_at: "2026-03-26T12:00:00.000Z",
        status: "archived",
        published_at: "2026-03-24T12:00:00.000Z",
        archived_at: "2026-03-25T12:00:00.000Z",
      },
    ]);
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const formData = buildAnnouncementFormData();
    formData.set("announcementId", ANNOUNCEMENT_ID);

    const redirectUrl = await captureRedirect(saveAnnouncementDraftAction(formData));

    expect(redirectUrl).toContain("/admin/announcements?error=");
    expect(getRedirectQueryParam(redirectUrl, "error")).toBe(
      "只有 draft 公告允许编辑。",
    );
    expect(harness.state.announcements[0]?.title).toBe("已归档");
    expect(harness.state.logs).toHaveLength(0);
  });

  it("blocks publishing for an archived announcement", async () => {
    const harness = createAnnouncementsHarness([
      {
        id: ANNOUNCEMENT_ID,
        title: "已归档",
        eyebrow: "提醒",
        audience: "user",
        body: "内容",
        starts_at: "2026-03-24T12:00:00.000Z",
        ends_at: "2026-03-26T12:00:00.000Z",
        status: "archived",
        published_at: "2026-03-24T12:00:00.000Z",
        archived_at: "2026-03-25T12:00:00.000Z",
      },
    ]);
    createAdminSupabaseClientMock.mockReturnValue(harness.adminClient);

    const formData = new FormData();
    formData.set("announcementId", ANNOUNCEMENT_ID);

    const redirectUrl = await captureRedirect(publishAnnouncementAction(formData));

    expect(redirectUrl).toContain("/admin/announcements?error=");
    expect(getRedirectQueryParam(redirectUrl, "error")).toBe(
      "只有 draft 公告允许发布。",
    );
    expect(harness.state.announcements[0]?.status).toBe("archived");
    expect(harness.state.logs).toHaveLength(0);
  });
});
