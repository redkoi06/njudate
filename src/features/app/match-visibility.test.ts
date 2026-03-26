import { beforeEach, describe, expect, it, vi } from "vitest";

const { createServerSupabaseClientMock } = vi.hoisted(() => ({
  createServerSupabaseClientMock: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: createServerSupabaseClientMock,
}));

import {
  getMatchDetail,
  getMatchRecords,
  getNotifications,
} from "@/features/app/data";

function createBuilder(terminals: Partial<Record<string, unknown>>) {
  const builder: Record<string, unknown> = {};
  const chainMethods = [
    "select",
    "eq",
    "in",
    "not",
    "order",
    "range",
    "maybeSingle",
    "single",
  ];

  for (const method of chainMethods) {
    builder[method] = vi.fn(() => {
      if (method in terminals) {
        return Promise.resolve(terminals[method]);
      }

      return builder;
    });
  }

  return builder;
}

describe("match visibility", () => {
  beforeEach(() => {
    createServerSupabaseClientMock.mockReset();
  });

  it("returns only released results from published batches", async () => {
    const matchResultsBuilder = createBuilder({
      order: {
        data: [
          {
            id: "result-latest",
            batch_id: "batch-published",
            status: "matched",
            preview_text: "latest preview",
            score: 88,
            viewed_at: null,
            released_at: "2026-03-26T10:00:00Z",
          },
          {
            id: "result-earlier",
            batch_id: "batch-earlier",
            status: "unmatched",
            preview_text: "earlier preview",
            score: null,
            viewed_at: "2026-03-25T10:05:00Z",
            released_at: "2026-03-25T10:00:00Z",
          },
          {
            id: "result-failed",
            batch_id: "batch-failed",
            status: "matched",
            preview_text: "preview",
            score: 81,
            viewed_at: null,
            released_at: "2026-03-25T10:00:00Z",
          },
        ],
        error: null,
      },
    });
    const batchesBuilder = createBuilder({
      in: {
        data: [
          {
            id: "batch-published",
            label: "第 1 轮",
            round_no: 1,
            status: "published",
          },
          {
            id: "batch-earlier",
            label: "第 0 轮",
            round_no: 0,
            status: "published",
          },
          {
            id: "batch-failed",
            label: "第 2 轮",
            round_no: 2,
            status: "failed",
          },
        ],
        error: null,
      },
    });

    createServerSupabaseClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "match_results") {
          return matchResultsBuilder;
        }

        if (table === "match_batches") {
          return batchesBuilder;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const records = await getMatchRecords("user-1");

    expect(matchResultsBuilder.order).toHaveBeenCalledWith("released_at", {
      ascending: false,
    });
    expect(records).toHaveLength(2);
    expect(records[0]?.id).toBe("result-latest");
    expect(records[0]?.batchLabel).toBe("第 1 轮");
    expect(records[0]?.roundNo).toBe(1);
    expect(records[1]?.id).toBe("result-earlier");
    expect(records[1]?.roundNo).toBe(0);
  });

  it("returns null for a released result whose batch is not published", async () => {
    const matchResultsBuilder = createBuilder({
      maybeSingle: {
        data: {
          id: "result-1",
          batch_id: "batch-1",
          match_pair_id: null,
          status: "matched",
          preview_text: "preview",
          score: 90,
          viewed_at: null,
          released_at: "2026-03-25T10:00:00Z",
          reasons: [],
          shared_signals: [],
          counterpart_snapshot_json: null,
        },
        error: null,
      },
    });
    const batchBuilder = createBuilder({
      single: {
        data: {
          label: "第 3 轮",
          round_no: 3,
          status: "failed",
        },
        error: null,
      },
    });

    createServerSupabaseClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "match_results") {
          return matchResultsBuilder;
        }

        if (table === "match_batches") {
          return batchBuilder;
        }

        if (table === "match_pairs") {
          return createBuilder({
            maybeSingle: {
              data: null,
              error: null,
            },
          });
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const detail = await getMatchDetail("user-1", "result-1");

    expect(detail).toBeNull();
  });

  it("filters out unreleased match-result notifications", async () => {
    const notificationsBuilder = createBuilder({
      range: {
        data: [
          {
            id: "notification-match",
            title: "匹配结果",
            body: "body",
            level: "success",
            is_read: false,
            created_at: "2026-03-25T12:00:00Z",
            source_type: "match_result",
            source_id: "result-hidden",
          },
          {
            id: "notification-general",
            title: "平台公告",
            body: "body",
            level: "info",
            is_read: false,
            created_at: "2026-03-25T11:00:00Z",
            source_type: "announcement",
            source_id: null,
          },
        ],
        error: null,
      },
    });
    const releasedResultsBuilder = createBuilder({
      not: {
        data: [],
        error: null,
      },
    });

    createServerSupabaseClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "notifications") {
          return notificationsBuilder;
        }

        if (table === "match_results") {
          return releasedResultsBuilder;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const notifications = await getNotifications("user-1");

    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.id).toBe("notification-general");
  });

  it("keeps paging notifications until it collects three visible items", async () => {
    const hiddenPage = Array.from({ length: 24 }, (_, index) => ({
      id: `notification-hidden-${index + 1}`,
      title: "未发布结果",
      body: "body",
      level: "success" as const,
      is_read: false,
      created_at: `2026-03-25T12:${String(index).padStart(2, "0")}:00Z`,
      source_type: "match_result",
      source_id: `result-hidden-${index + 1}`,
    }));
    const visiblePage = Array.from({ length: 3 }, (_, index) => ({
      id: `notification-visible-${index + 1}`,
      title: `普通通知 ${index + 1}`,
      body: "body",
      level: "info" as const,
      is_read: false,
      created_at: `2026-03-24T12:${String(index).padStart(2, "0")}:00Z`,
      source_type: "announcement",
      source_id: null,
    }));

    const notificationsBuilder = {
      eq: vi.fn(),
      order: vi.fn(),
      range: vi.fn(),
      select: vi.fn(),
    };

    notificationsBuilder.select.mockReturnValue(notificationsBuilder);
    notificationsBuilder.eq.mockReturnValue(notificationsBuilder);
    notificationsBuilder.order.mockReturnValue(notificationsBuilder);
    notificationsBuilder.range.mockImplementation((from: number) =>
      Promise.resolve({
        data:
          from === 0
            ? hiddenPage
            : from === 24
              ? visiblePage
              : [],
        error: null,
      }),
    );

    const releasedResultsBuilder = createBuilder({
      not: {
        data: [],
        error: null,
      },
    });

    createServerSupabaseClientMock.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === "notifications") {
          return notificationsBuilder;
        }

        if (table === "match_results") {
          return releasedResultsBuilder;
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    });

    const notifications = await getNotifications("user-1");

    expect(notifications).toHaveLength(3);
    expect(notifications[0]?.id).toBe("notification-visible-1");
    expect(notifications[2]?.id).toBe("notification-visible-3");
    expect(notificationsBuilder.range).toHaveBeenCalledTimes(2);
  });
});
