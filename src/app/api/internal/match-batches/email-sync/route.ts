import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env/server";
import { syncPendingMatchResultEmails } from "@/lib/matching/batch-runner";

function getAutomationSecret() {
  const env = getServerEnv();

  if (!env.INTERNAL_AUTOMATION_SECRET) {
    throw new Error("INTERNAL_AUTOMATION_SECRET is not configured.");
  }

  return env.INTERNAL_AUTOMATION_SECRET;
}

export async function POST(request: NextRequest) {
  let expectedSecret: string;

  try {
    expectedSecret = getAutomationSecret();
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal configuration error.",
      },
      { status: 500 },
    );
  }

  const providedSecret = request.headers.get("x-internal-automation-secret");

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      {
        error: "Unauthorized.",
      },
      { status: 401 },
    );
  }

  const body = await request.json().catch(() => null);
  const batchId = body && typeof body.batchId === "string" ? body.batchId : "";

  if (!batchId) {
    return NextResponse.json(
      {
        error: "batchId is required.",
      },
      { status: 400 },
    );
  }

  await syncPendingMatchResultEmails(batchId);

  return NextResponse.json({
    batchId,
    ok: true,
  });
}
