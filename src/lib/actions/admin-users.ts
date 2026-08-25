"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";

export async function setUserStatus(
  userId: string,
  status: "ACTIVE" | "SUSPENDED",
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return { error: "User not found." };
  if (user.role === "ADMIN") return { error: "Admin accounts can't be suspended here." };

  await prisma.user.update({ where: { id: userId }, data: { status } });

  await logAudit({
    actorId: admin.id,
    action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
    targetType: "User",
    targetId: userId,
  });

  revalidatePath("/admin/tutors");
  revalidatePath("/admin/clients");

  return {};
}

export async function setTutorPublished(
  tutorProfileId: string,
  isPublished: boolean,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const profile = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
  if (!profile) return { error: "Tutor profile not found." };

  await prisma.tutorProfile.update({
    where: { id: tutorProfileId },
    data: { isPublished },
  });

  await logAudit({
    actorId: admin.id,
    action: isPublished ? "TUTOR_PROFILE_PUBLISHED_BY_ADMIN" : "TUTOR_PROFILE_UNPUBLISHED_BY_ADMIN",
    targetType: "TutorProfile",
    targetId: tutorProfileId,
  });

  revalidatePath("/admin/tutors");

  return {};
}

export async function resendTutorSetupEmail(
  userId: string,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "TUTOR") return { error: "Tutor not found." };

  const resetToken = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token: resetToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const setPasswordUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "Set up your Channel Tutoring account",
    html: baseEmailLayout(`
      <p>Hi ${user.name},</p>
      <p>Here's a fresh link to set a password and access your tutor
      dashboard:</p>
      <p><a href="${setPasswordUrl}" style="color:#C9A227;font-weight:bold;">Set your password</a></p>
      <p>This link expires in 7 days.</p>
    `),
  }).catch(() => {});

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_SETUP_EMAIL_RESENT",
    targetType: "User",
    targetId: user.id,
  });

  return {};
}
