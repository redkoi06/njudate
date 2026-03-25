import { createClient } from "npm:@supabase/supabase-js";

import {
  runBatchAutomationSweep,
  type BatchLifecycleContext,
} from "../../../src/lib/matching/lifecycle-core.ts";
import type { Database } from "../../../src/types/database.generated.ts";

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

function getJsonHeaders() {
  return {
    "content-type": "application/json; charset=utf-8",
  };
}

function authorizeRequest(request: Request) {
  const expectedSecret = getRequiredEnv("CRON_SECRET");
  const providedSecret = request.headers.get("x-cron-secret");

  return providedSecret === expectedSecret;
}

async function syncPublishedBatchEmails(batchId: string) {
  const siteUrl = getRequiredEnv("NEXT_PUBLIC_SITE_URL");
  const secret = getRequiredEnv("INTERNAL_AUTOMATION_SECRET");
  const response = await fetch(
    new URL("/api/internal/match-batches/email-sync", siteUrl),
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-internal-automation-secret": secret,
      },
      body: JSON.stringify({
        batchId,
      }),
    },
  );

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(
      `Email sync request failed with ${response.status}: ${payload || "empty response"}`,
    );
  }
}

function createEdgeLifecycleContext() {
  const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const admin = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });

  return {
    admin,
    actorRole: "system",
    afterPublish: syncPublishedBatchEmails,
    createUuid: () => crypto.randomUUID(),
    nowIso: new Date().toISOString(),
  } satisfies BatchLifecycleContext;
}

Deno.serve(async (request) => {
  try {
    if (!authorizeRequest(request)) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized.",
        }),
        {
          headers: getJsonHeaders(),
          status: 401,
        },
      );
    }

    const result = await runBatchAutomationSweep(createEdgeLifecycleContext());

    return new Response(JSON.stringify(result), {
      headers: getJsonHeaders(),
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: getJsonHeaders(),
        status: 500,
      },
    );
  }
});
