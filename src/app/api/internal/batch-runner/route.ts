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

export async function POST(request: NextRequest) {
  const env = getServerEnv();
  const expectedSecret = env.BATCH_RUNNER_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: "BATCH_RUNNER_SECRET is not configured." },
      { status: 500 },
    );
  }

  const providedSecret =
    request.headers.get("x-batch-runner-secret") ?? getBearerToken(request);

  if (providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const summary = await runBatchLifecycle();
  return NextResponse.json(summary);
}
