import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getMatchDetailMock,
  notFoundMock,
  redirectMock,
  requireAppUserMock,
  triggerMatchContactActionMock,
} = vi.hoisted(() => ({
  getMatchDetailMock: vi.fn(),
  notFoundMock: vi.fn(),
  redirectMock: vi.fn(),
  requireAppUserMock: vi.fn(),
  triggerMatchContactActionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

vi.mock("@/features/app/actions", () => ({
  triggerMatchContactAction: triggerMatchContactActionMock,
}));

vi.mock("@/features/app/data", () => ({
  getMatchDetail: getMatchDetailMock,
}));

vi.mock("@/lib/auth/session", () => ({
  requireAppUser: requireAppUserMock,
}));

import MatchDetailPage from "@/app/app/matches/[matchId]/page";

describe("MatchDetailPage", () => {
  beforeEach(() => {
    getMatchDetailMock.mockReset();
    notFoundMock.mockReset();
    redirectMock.mockReset();
    requireAppUserMock.mockReset();
    triggerMatchContactActionMock.mockReset();
    requireAppUserMock.mockResolvedValue({ id: "user-1" });
  });

  it("renders the explanation and trigger note before contact info is opened", async () => {
    getMatchDetailMock.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440000",
      batchLabel: "第 1 轮",
      roundNo: 1,
      status: "matched",
      previewText: null,
      score: null,
      viewedAt: null,
      releasedAt: "2026-03-29T10:00:00.000Z",
      reasons: ["你们聊得来。"],
      sharedSignals: [],
      counterpartSnapshot: {
        campus: "仙林校区",
        department: "计算机学院",
        grade: "研二",
      },
      contactStatus: "idle",
      contactInfo: null,
      matchPairId: "pair-1",
    });

    render(
      await MatchDetailPage({
        params: Promise.resolve({
          matchId: "550e8400-e29b-41d4-a716-446655440000",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "关于这次匹配" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "这次匹配会先排除在关键观念或生活习惯上可能存在明显冲突的人。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("在此基础上，系统会优先为你匹配问卷回答较为接近的人。"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "我们没有展示相似度分数，因为比起一组数字，我们更希望你通过真实交流，去认识对方是一个怎样的人。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "算法能帮助你们相遇，真正让人靠近彼此的，还是交流、感受，以及一点缘分。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("点击后，双方都将立即看到彼此的联系方式。"),
    ).toBeInTheDocument();
  });

  it("renders the release note after contact info is opened", async () => {
    getMatchDetailMock.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440001",
      batchLabel: "第 1 轮",
      roundNo: 1,
      status: "matched",
      previewText: null,
      score: null,
      viewedAt: null,
      releasedAt: "2026-03-29T10:00:00.000Z",
      reasons: ["你们聊得来。"],
      sharedSignals: [],
      counterpartSnapshot: {
        campus: "仙林校区",
        department: "计算机学院",
        grade: "研二",
      },
      contactStatus: "completed",
      contactInfo: {
        nickname: "xianlin_f1",
        email: "22222@smail.nju.edu.cn",
      },
      matchPairId: "pair-1",
    });

    render(
      await MatchDetailPage({
        params: Promise.resolve({
          matchId: "550e8400-e29b-41d4-a716-446655440001",
        }),
      }),
    );

    expect(
      screen.getByText(
        "由于一方已选择获取联系方式，双方的联系方式现已同时开放。",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("昵称：xianlin_f1")).toBeInTheDocument();
    expect(
      screen.getByText("邮箱：22222@smail.nju.edu.cn"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("点击后，双方都将立即看到彼此的联系方式。"),
    ).not.toBeInTheDocument();
  });

  it("renders the unmatched explanation and hides the empty contact section", async () => {
    getMatchDetailMock.mockResolvedValue({
      id: "550e8400-e29b-41d4-a716-446655440002",
      batchLabel: "第 2 轮",
      roundNo: 2,
      status: "unmatched",
      previewText: null,
      score: null,
      viewedAt: null,
      releasedAt: "2026-03-29T10:00:00.000Z",
      reasons: [],
      sharedSignals: [],
      counterpartSnapshot: null,
      contactStatus: null,
      contactInfo: null,
      matchPairId: null,
    });

    render(
      await MatchDetailPage({
        params: Promise.resolve({
          matchId: "550e8400-e29b-41d4-a716-446655440002",
        }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "关于这次未匹配" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "这次没有匹配成功，并不代表你“不适合谁”，也不意味着系统只是按分数高低简单排序。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "我们的匹配会先排除在关键观念或生活习惯上可能存在明显冲突的组合；在此基础上，才会优先考虑问卷回答较为接近的人。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "因此，本轮暂未匹配，通常只说明在当前参与者范围内，我们还没有找到同时满足这些条件的对象。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "我们希望先帮大家避开明显不合适的人，再把真正的认识与判断，留给后续的交流、感受，以及一点缘分。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "如果你认可这样的匹配方式，也欢迎把网站推荐给身边同样认真对待关系的人。参与的人越多，系统就越有机会在坚持这套原则的前提下，为大家创造新的相遇。",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "联系TA" }),
    ).not.toBeInTheDocument();
  });
});
