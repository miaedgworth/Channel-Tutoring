import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resendVerificationSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { issueVerificationCode } from "@/lib/email-verification";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`resend-verification:${ip}`, {
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
  const parsed = resendVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  // Always respond the same way (and after a consistent minimum delay) to
  // avoid leaking which emails are registered — see forgot-password/route.ts
  // for the same pattern.
  const startedAt = Date.now();
  const MIN_RESPONSE_MS = 400;

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (user && !user.emailVerifiedAt) {
    await issueVerificationCode(user.id, user.name, user.email);
  }

  const elapsed = Date.now() - startedAt;
  if (elapsed < MIN_RESPONSE_MS) {
    await new Promise((resolve) => setTimeout(resolve, MIN_RESPONSE_MS - elapsed));
  }

  return NextResponse.json({ ok: true });
}
