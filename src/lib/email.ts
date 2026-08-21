import { getResend, FROM_EMAIL } from "@/lib/resend";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const resend = getResend();
  if (!resend) {
    console.info(`[email:dev] to=${to} subject="${subject}"`);
    return;
  }
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}

export function baseEmailLayout(bodyHtml: string) {
  return `
  <div style="font-family: Calibri, Arial, sans-serif; background:#f5f6f8; padding:32px 0;">
    <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="background:#1B2A4A;padding:20px 32px;">
        <span style="color:#C9A227;font-family:Cambria,Georgia,serif;font-size:18px;font-weight:bold;">Channel Tutoring</span>
      </div>
      <div style="padding:32px;color:#1B2A4A;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:16px 32px;background:#f5f6f8;color:#6b7280;font-size:12px;">
        Channel Tutoring, Guernsey &middot; <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#1B2A4A;">channeltutoring.gg</a>
      </div>
    </div>
  </div>`;
}
