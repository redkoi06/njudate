import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { drainMatchResultEmailQueueMock, getServerEnvMock } = vi.hoisted(() => ({
  drainMatchResultEmailQueueMock: vi.fn(),
  getServerEnvMock: vi.fn(),
}));

vi.mock("@/lib/env/server", () => ({
  getServerEnv: getServerEnvMock,
}));

vi.mock("@/lib/matching/batch-runner", () => ({
  drainMatchResultEmailQueue: drainMatchResultEmailQueueMock,
}));

import { POST } from "@/app/api/internal/match-batches/email-sync/route";

describe("internal match-batch email sync route", () => {
  beforeEach(() => {
    drainMatchResultEmailQueueMock.mockReset();
    getServerEnvMock.mockReset();
    getServerEnvMock.mockReturnValue({
      INTERNAL_AUTOMATION_SECRET: "secret-token",
    });
    drainMatchResultEmailQueueMock.mockResolvedValue({
      attemptedCount: 3,
      failedCount: 1,
      sentCount: 2,
    });
  });

  it("rejects requests with an invalid secret", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/internal/match-batches/email-sync",
      {
        method: "POST",
        headers: {
          "x-internal-automation-secret": "wrong-token",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(drainMatchResultEmailQueueMock).not.toHaveBeenCalled();
  });

  it("drains the global match-result email queue when the secret is valid", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/internal/match-batches/email-sync",
      {
        method: "POST",
        headers: {
          "x-internal-automation-secret": "secret-token",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(drainMatchResultEmailQueueMock).toHaveBeenCalledWith();
    await expect(response.json()).resolves.toEqual({
      attemptedCount: 3,
      failedCount: 1,
      ok: true,
      sentCount: 2,
    });
  });

  it("accepts an empty body", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/internal/match-batches/email-sync",
      {
        method: "POST",
        body: "",
        headers: {
          "content-type": "application/json",
          "x-internal-automation-secret": "secret-token",
        },
      },
    );

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(drainMatchResultEmailQueueMock).toHaveBeenCalledOnce();
  });
});
