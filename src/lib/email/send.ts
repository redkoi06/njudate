import "server-only";

import { getServerEnv } from "@/lib/env/server";
import { getSmtpTransporter } from "@/lib/email/smtp";

type EmailInput = {
  to: string;
  subject: string;
  text: string;
};

export async function sendTransactionalEmail(input: EmailInput) {
  const env = getServerEnv();

  if (
    !env.SMTP_HOST ||
    !env.SMTP_PORT ||
    !env.SMTP_USERNAME ||
    !env.SMTP_PASSWORD ||
    !env.SMTP_FROM_EMAIL
  ) {
    return {
      ok: false,
      reason: "missing_config",
    } as const;
  }

  try {
    const transporter = getSmtpTransporter();
    const from = env.SMTP_FROM_NAME
      ? `"${env.SMTP_FROM_NAME}" <${env.SMTP_FROM_EMAIL}>`
      : env.SMTP_FROM_EMAIL;

    await transporter.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });

    return {
      ok: true,
      reason: null,
    } as const;
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof Error ? error.message : "unknown_error",
    } as const;
  }
}
