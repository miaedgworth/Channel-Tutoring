import { randomInt } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";
import { region } from "@/lib/region";

const CODE_LENGTH = 6;
const CODE_TTL_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function generateCode(): string {
  return randomInt(0, 10 ** CODE_LENGTH).toString().padStart(CODE_LENGTH, "0");
}

// Sends a fresh 6-digit code and invalidates any still-outstanding one for
// this user, so only the most recently emailed code is ever valid.
export async function issueVerificationCode(
  userId: string,
  name: string,
  email: string,
): Promise<void> {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  await prisma.$transaction([
    prisma.emailVerificationCode.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.emailVerificationCode.create({
      data: {
        userId,
        codeHash,
        expiresAt: new Date(Date.now() + CODE_TTL_MS),
      },
    }),
  ]);

  await sendEmail({
    to: email,
    subject: `Your ${region.brandName} verification code`,
    html: baseEmailLayout(`
      <p>Hi ${escapeHtml(name)},</p>
      <p>Your verification code is:</p>
      <p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#1B2A4A;">${code}</p>
      <p>Enter this code to finish creating your account. It expires in 15 minutes.</p>
      <p>Didn't request this? You can safely ignore this email.</p>
    `),
  }).catch(() => {});
}

export async function verifyCode(
  userId: string,
  code: string,
): Promise<{ error: string } | { error?: undefined }> {
  const record = await prisma.emailVerificationCode.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });

  if (!record || record.expiresAt < new Date()) {
    return { error: "That code has expired. Request a new one." };
  }
  if (record.attempts >= MAX_ATTEMPTS) {
    return { error: "Too many incorrect attempts. Request a new code." };
  }

  const valid = await bcrypt.compare(code, record.codeHash);
  if (!valid) {
    await prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { error: "Incorrect code. Please try again." };
  }

  await prisma.$transaction([
    prisma.emailVerificationCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return {};
}
