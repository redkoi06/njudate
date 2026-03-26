import { render, screen, within } from "@testing-library/react";
import { createElement, type AnchorHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getMatchRecordsMock, requireAppUserMock } = vi.hoisted(() => ({
  getMatchRecordsMock: vi.fn(),
  requireAppUserMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...props
  }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    createElement("a", { href, ...props }, children),
}));

vi.mock("@/features/app/data", () => ({
  getMatchRecords: getMatchRecordsMock,
}));

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: requireAppUserMock,
}));

import MatchesPage from "@/app/app/matches/page";

describe("MatchesPage", () => {
  beforeEach(() => {
    getMatchRecordsMock.mockReset();
    requireAppUserMock.mockReset();
    requireAppUserMock.mockResolvedValue({ id: "user-1" });
  });

  it("renders the latest match separately from history", async () => {
    getMatchRecordsMock.mockResolvedValue([
      {
        id: "match-3",
        batchLabel: "第 3 轮",
        roundNo: 3,
        status: "matched",
        previewText: "最新摘要",
        score: 99,
        viewedAt: null,
        releasedAt: "2026-03-26T10:00:00.000Z",
      },
      {
        id: "match-2",
        batchLabel: "第 2 轮",
        roundNo: 2,
        status: "matched",
        previewText: "历史摘要一",
        score: 88,
        viewedAt: "2026-03-25T10:00:00.000Z",
        releasedAt: "2026-03-25T10:00:00.000Z",
      },
      {
        id: "match-1",
        batchLabel: "第 1 轮",
        roundNo: 1,
        status: "unmatched",
        previewText: "历史摘要二",
        score: null,
        viewedAt: "2026-03-24T10:00:00.000Z",
        releasedAt: "2026-03-24T10:00:00.000Z",
      },
    ]);

    render(await MatchesPage());

    expect(screen.getByRole("heading", { name: "最近一次匹配" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "历史匹配" })).toBeInTheDocument();
    expect(screen.getAllByText("第 3 轮")).toHaveLength(1);
    expect(screen.queryByText("最新摘要")).not.toBeInTheDocument();
    expect(screen.queryByText("历史摘要一")).not.toBeInTheDocument();
    expect(screen.queryByText("历史摘要二")).not.toBeInTheDocument();
    expect(screen.getAllByText("匹配成功")).toHaveLength(2);
    expect(screen.getByText("未匹配")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "查看详情" })).toHaveLength(2);
    expect(screen.queryByText(/匹配得分：/)).not.toBeInTheDocument();
    expect(screen.queryByText(/查看状态：/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/发布时间：/)).toHaveLength(3);

    const historyHeading = screen.getByRole("heading", { name: "历史匹配" });
    const historySection = historyHeading.parentElement?.nextElementSibling as
      | HTMLElement
      | null;
    expect(historySection).not.toBeNull();
    if (historySection) {
      expect(within(historySection).queryByText(/匹配得分：/)).not.toBeInTheDocument();
      expect(within(historySection).queryByText(/查看状态：/)).not.toBeInTheDocument();
    }

    const detailLinks = screen.getAllByRole("link", { name: "查看详情" });
    for (const link of detailLinks) {
      expect(link.className).toContain("rounded-full");
      expect(link.className).toContain("border");
      expect(link.className).toContain("px-5");
      expect(link.className).toContain("hover:bg-secondary/80");
      expect(link.className).toContain("hover:text-foreground");
    }
  });

  it("renders only the latest match when there is no history", async () => {
    getMatchRecordsMock.mockResolvedValue([
      {
        id: "match-1",
        batchLabel: "第 1 轮",
        roundNo: 1,
        status: "unmatched",
        previewText: "唯一摘要",
        score: 100,
        viewedAt: "2026-03-26T10:00:00.000Z",
        releasedAt: "2026-03-26T10:00:00.000Z",
      },
    ]);

    render(await MatchesPage());

    expect(screen.getByRole("heading", { name: "最近一次匹配" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "历史匹配" })).not.toBeInTheDocument();
    expect(screen.queryByText("唯一摘要")).not.toBeInTheDocument();
    expect(screen.queryByText(/匹配得分：/)).not.toBeInTheDocument();
    expect(screen.queryByText(/查看状态：/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "查看详情" })).not.toBeInTheDocument();
  });

  it("renders the empty state when there are no match records", async () => {
    getMatchRecordsMock.mockResolvedValue([]);

    render(await MatchesPage());

    expect(screen.getByText("还没有匹配记录")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "最近一次匹配" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "历史匹配" })).not.toBeInTheDocument();
  });
});
