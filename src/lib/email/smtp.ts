import "server-only";

import nodemailer from "nodemailer";

import { getServerEnv } from "@/lib/env/server";

let transporter:
  | ReturnType<typeof nodemailer.createTransport>
  | null = null;

export function getSmtpTransporter() {
  if (transporter) {
    return transporter;
  }

  const env = getServerEnv();

  if (
    !env.SMTP_HOST ||
    !env.SMTP_PORT ||
    !env.SMTP_USERNAME ||
    !env.SMTP_PASSWORD
  ) {
    throw new Error("SMTP configuration is incomplete.");
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE ?? env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USERNAME,
      pass: env.SMTP_PASSWORD,
    },
  });

  return transporter;
}
