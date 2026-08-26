import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8).max(72),
});

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`reset-password:${ip}`, {
    limit: 10,
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
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token: parsed.data.token },
  });

  if (
    !resetToken ||
    resetToken.usedAt ||
    resetToken.expiresAt < new Date()
  ) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  try {
    await prisma.$transaction(async (tx) => {
      // Atomically claim the token (only succeeds while it's still
      // unused) before touching the password — otherwise two concurrent
      // requests with the same token could both pass the check above and
      // both "successfully" set a password from one single-use link.
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: resetToken.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new Error("USED");
      }

      await tx.user.update({
        where: { id: resetToken.userId },
        // passwordChangedAt invalidates any other session issued before
        // this reset, on that user's next request — see auth.ts.
        data: { passwordHash, passwordChangedAt: new Date() },
      });

      // A password reset supersedes any other still-outstanding reset
      // link for this user (e.g. they requested the email twice) — leaving
      // an older, still-valid link usable would let it be used to
      // overwrite the password again right after this legitimate reset.
      await tx.passwordResetToken.deleteMany({
        where: { userId: resetToken.userId, id: { not: resetToken.id }, usedAt: null },
      });
    });
  } catch (err) {
    if (err instanceof Error && err.message === "USED") {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired." },
        { status: 400 },
      );
    }
    throw err;
  }

  await logAudit({
    actorId: resetToken.userId,
    action: "PASSWORD_RESET",
    targetType: "User",
    targetId: resetToken.userId,
  });

  return NextResponse.json({ ok: true });
}
