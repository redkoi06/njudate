import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { countActiveSubmittedQuestionnaireUsers } from "@/lib/questionnaire-metrics";

describe("countActiveSubmittedQuestionnaireUsers", () => {
  it("returns 0 when questionnaireVersionId is null", async () => {
    const supabase = {
      rpc: vi.fn(),
    };

    await expect(
      countActiveSubmittedQuestionnaireUsers(supabase as never, null),
    ).resolves.toBe(0);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("returns the aggregated count from the database function", async () => {
    const supabase = {
      rpc: vi.fn(async () => ({
        data: 2,
        error: null,
      })),
    };

    await expect(
      countActiveSubmittedQuestionnaireUsers(supabase as never, "version-1"),
    ).resolves.toBe(2);

    expect(supabase.rpc).toHaveBeenCalledWith(
      "count_active_submitted_questionnaire_users",
      {
        p_questionnaire_version_id: "version-1",
      },
    );
  });
});
