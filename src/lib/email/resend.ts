import "server-only";

import { Resend } from "resend";

import { getServerEnv } from "@/lib/env/server";

let resendClient: Resend | null = null;

export function getResendClient() {
  if (resendClient) {
    return resendClient;
  }

  const { RESEND_API_KEY } = getServerEnv();

  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  resendClient = new Resend(RESEND_API_KEY);

  return resendClient;
}
