import { Resend } from "resend";

let client: Resend | null = null;

export function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey.startsWith("re_placeholder")) return null;
  if (!client) client = new Resend(apiKey);
  return client;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Channel Tutoring <info@channeltutoring.com>";
