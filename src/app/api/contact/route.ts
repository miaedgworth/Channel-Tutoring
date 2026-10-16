import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { contactSchema } from "@/lib/validations/contact";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";
import { region } from "@/lib/region";
import { CONTACT_NOTIFICATION_EMAIL } from "@/lib/constants";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const session = await auth();
  const { name, email, subject, message } = parsed.data;

  await prisma.contactMessage.create({
    data: { name, email, subject, message, userId: session?.user?.id ?? null },
  });

  await sendEmail({
    to: email,
    subject: "We've received your message",
    html: baseEmailLayout(`
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for getting in touch with ${region.brandName}. We've received
      your message and will get back to you as soon as possible.</p>
      <p><strong>Your message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
    `),
  }).catch(() => {});

  await sendEmail({
    to: CONTACT_NOTIFICATION_EMAIL,
    subject: `New enquiry: ${subject}`,
    html: baseEmailLayout(`
      <p><strong>${escapeHtml(name)}</strong> (${escapeHtml(email)}) sent a message
      through the contact form:</p>
      <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/contact-messages" style="color:#C9A227;font-weight:bold;">View in admin</a></p>
    `),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
