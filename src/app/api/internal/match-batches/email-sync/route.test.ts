import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { getServerEnvMock, syncPendingMatchResultEmailsMock } = vi.hoisted(
  () => ({
    getServerEnvMock: vi.fn(),
    syncPendingMatchResultEmailsMock: vi.fn(),
  }),
);

vi.mock("@/lib/env/server", () => ({
  getServerEnv: getServerEnvMock,
}));

vi.mock("@/lib/matching/batch-runner", () => ({
  syncPendingMatchResultEmails: syncPendingMatchResultEmailsMock,
}));

import { POST } from "@/app/api/internal/match-batches/email-sync/route";

describe("internal match-batch email sync route", () => {
  beforeEach(() => {
    getServerEnvMock.mockReset();
    syncPendingMatchResultEmailsMock.mockReset();
    getServerEnvMock.mockReturnValue({
      INTERNAL_AUTOMATION_SECRET: "secret-token",
    });
  });

  it("rejects requests with an invalid secret", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/internal/match-batches/email-sync",
      {
        method: "POST",
        body: JSON.stringify({
          batchId: "batch-1",
        }),
        headers: {
          "content-type": "application/json",
          "x-internal-automation-secret": "wrong-token",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(syncPendingMatchResultEmailsMock).not.toHaveBeenCalled();
  });

  it("syncs pending match-result emails when the secret is valid", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/internal/match-batches/email-sync",
      {
        method: "POST",
        body: JSON.stringify({
          batchId: "batch-1",
        }),
        headers: {
          "content-type": "application/json",
          "x-internal-automation-secret": "secret-token",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(syncPendingMatchResultEmailsMock).toHaveBeenCalledWith("batch-1");
  });
});
