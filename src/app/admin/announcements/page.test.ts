import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAnnouncementForEditMock, listAnnouncementsMock } = vi.hoisted(() => ({
  getAnnouncementForEditMock: vi.fn(),
  listAnnouncementsMock: vi.fn(),
}));

vi.mock("@/features/admin/announcements/actions", () => ({
  archiveAnnouncementAction: vi.fn(),
  publishAnnouncementAction: vi.fn(),
  saveAnnouncementDraftAction: vi.fn(),
}));

vi.mock("@/features/admin/announcements/data", () => ({
  getAnnouncementForEdit: getAnnouncementForEditMock,
  listAnnouncements: listAnnouncementsMock,
}));

import AdminAnnouncementsPage from "@/app/admin/announcements/page";

const VALID_ARCHIVED_ANNOUNCEMENT_ID = "77777777-7777-4777-8777-777777777777";

describe("AdminAnnouncementsPage", () => {
  beforeEach(() => {
    getAnnouncementForEditMock.mockReset();
    listAnnouncementsMock.mockReset();
  });

  it("shows actions only for draft and published announcements", async () => {
    listAnnouncementsMock.mockResolvedValue([
      {
        id: "draft-1",
        title: "草稿公告",
        body: "body",
        eyebrow: "眉题",
        audience: "all",
        status: "draft",
        startsAt: "2026-03-25T12:00:00.000Z",
        endsAt: "2026-03-26T12:00:00.000Z",
        createdAt: "2026-03-25T12:00:00.000Z",
        updatedAt: "2026-03-25T12:00:00.000Z",
        publishedAt: null,
        archivedAt: null,
      },
      {
        id: "published-1",
        title: "已发布公告",
        body: "body",
        eyebrow: "眉题",
        audience: "user",
        status: "published",
        startsAt: "2026-03-25T12:00:00.000Z",
        endsAt: "2026-03-26T12:00:00.000Z",
        createdAt: "2026-03-25T12:00:00.000Z",
        updatedAt: "2026-03-25T12:00:00.000Z",
        publishedAt: "2026-03-25T12:00:00.000Z",
        archivedAt: null,
      },
      {
        id: "archived-1",
        title: "已归档公告",
        body: "body",
        eyebrow: "眉题",
        audience: "user",
        status: "archived",
        startsAt: "2026-03-25T12:00:00.000Z",
        endsAt: "2026-03-26T12:00:00.000Z",
        createdAt: "2026-03-25T12:00:00.000Z",
        updatedAt: "2026-03-25T12:00:00.000Z",
        publishedAt: "2026-03-25T12:00:00.000Z",
        archivedAt: "2026-03-26T12:00:00.000Z",
      },
    ]);
    getAnnouncementForEditMock.mockResolvedValue(null);

    render(
      await AdminAnnouncementsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(screen.getAllByRole("link", { name: "编辑" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "发布" })).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "归档" })).toHaveLength(1);
    expect(screen.getByText("已归档公告")).toBeInTheDocument();
  });

  it("does not enter edit mode for a non-draft announcement", async () => {
    listAnnouncementsMock.mockResolvedValue([]);
    getAnnouncementForEditMock.mockResolvedValue({
      id: VALID_ARCHIVED_ANNOUNCEMENT_ID,
      title: "已归档公告",
      body: "body",
      eyebrow: "眉题",
      audience: "user",
      status: "archived",
      startsAt: "2026-03-25T12:00:00.000Z",
      endsAt: "2026-03-26T12:00:00.000Z",
      createdAt: "2026-03-25T12:00:00.000Z",
      updatedAt: "2026-03-25T12:00:00.000Z",
      publishedAt: "2026-03-25T12:00:00.000Z",
      archivedAt: "2026-03-26T12:00:00.000Z",
    });

    render(
      await AdminAnnouncementsPage({
        searchParams: Promise.resolve({ edit: VALID_ARCHIVED_ANNOUNCEMENT_ID }),
      }),
    );

    expect(screen.getByText("只有 draft 公告允许进入编辑状态。")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "新建 draft 公告" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "取消编辑" })).not.toBeInTheDocument();
  });
});
