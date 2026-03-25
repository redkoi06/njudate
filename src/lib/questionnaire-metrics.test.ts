import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { countActiveSubmittedQuestionnaireUsers } from "@/lib/questionnaire-metrics";

function createQuery<T>(result: T) {
  const query: Record<string, unknown> = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    neq: vi.fn(() => query),
    then<TResult1, TResult2 = never>(
      onfulfilled?:
        | ((value: { data: T; error: null; count?: number }) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve({ data: result, error: null }).then(
        onfulfilled,
        onrejected,
      );
    },
  };

  return query;
}

describe("countActiveSubmittedQuestionnaireUsers", () => {
  it("returns 0 when questionnaireVersionId is null", async () => {
    const supabase = {
      from: vi.fn(),
    };

    await expect(
      countActiveSubmittedQuestionnaireUsers(supabase as never, null),
    ).resolves.toBe(0);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("deduplicates submitted users and excludes deleted accounts", async () => {
    const activeUsersQuery: Record<string, unknown> = {
      in: vi.fn(() => activeUsersQuery),
      neq: vi.fn(() =>
        Promise.resolve({
          count: 2,
          error: null,
        }),
      ),
    };

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "questionnaire_submissions") {
          return {
            select: vi.fn(() =>
              createQuery([
                { user_id: "user-1" },
                { user_id: "user-2" },
                { user_id: "user-2" },
                { user_id: "user-3" },
              ]),
            ),
          };
        }

        if (table === "app_users") {
          return {
            select: vi.fn(() => activeUsersQuery),
          };
        }

        throw new Error(`Unexpected table: ${table}`);
      }),
    };

    await expect(
      countActiveSubmittedQuestionnaireUsers(supabase as never, "version-1"),
    ).resolves.toBe(2);
  });
});
