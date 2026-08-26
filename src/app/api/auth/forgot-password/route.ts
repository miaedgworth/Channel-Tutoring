import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, baseEmailLayout } from "@/lib/email";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`forgot-password:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Always respond with success (and after a consistent minimum delay) to
  // avoid leaking which emails are registered — without the delay, the
  // extra DB write + outbound email-provider call this branch does versus
  // the other returning almost immediately is an easily measurable timing
  // side-channel that defeats the point of always returning { ok: true }.
  const startedAt = Date.now();
  const MIN_RESPONSE_MS = 400;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: user.email,
      subject: "Reset your Channel Tutoring password",
      html: baseEmailLayout(`
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="color:#C9A227;font-weight:bold;">Reset your password</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
      `),
    }).catch(() => {});
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
  }

  return NextResponse.json({ ok: true });
}
