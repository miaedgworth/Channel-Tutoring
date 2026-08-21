import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { contactSchema } from "@/lib/validations/contact";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, baseEmailLayout } from "@/lib/email";

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
      <p>Hi ${name},</p>
      <p>Thanks for getting in touch with Channel Tutoring. We've received
      your message and will get back to you as soon as possible.</p>
      <p><strong>Your message:</strong></p>
      <p>${message.replace(/\n/g, "<br />")}</p>
    `),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
