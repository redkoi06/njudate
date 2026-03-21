import { NextResponse, type NextRequest } from "next/server";

import { getServerEnv } from "@/lib/env/server";
import { runBatchLifecycle } from "@/lib/matching/batch-runner";

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}

function getConfiguredBatchRunnerSecrets() {
  const env = getServerEnv();
  return env.CRON_SECRET ? [env.CRON_SECRET] : [];
}

async function handleBatchRunnerRequest(request: NextRequest) {
  const expectedSecrets = getConfiguredBatchRunnerSecrets();

  if (expectedSecrets.length === 0) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const providedSecret =
    request.headers.get("x-batch-runner-secret") ?? getBearerToken(request);

  if (!providedSecret || !expectedSecrets.includes(providedSecret)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = await runBatchLifecycle();
  return NextResponse.json(summary);
}

export async function GET(request: NextRequest) {
  return handleBatchRunnerRequest(request);
}

export async function POST(request: NextRequest) {
  return handleBatchRunnerRequest(request);
}
