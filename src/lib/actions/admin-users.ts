"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { region } from "@/lib/region";

const addAdminSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

export async function adminCreateAdmin(
  input: { name: string; email: string },
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");
  const parsed = addAdminSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    if (existing.role === "ADMIN") {
      return { error: "This email already belongs to an admin." };
    }

    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "ADMIN", status: "ACTIVE" },
    });

    await logAudit({
      actorId: admin.id,
      action: "USER_PROMOTED_TO_ADMIN",
      targetType: "User",
      targetId: existing.id,
    });

    await sendEmail({
      to: existing.email,
      subject: `You've been made an admin on ${region.brandName}`,
      html: baseEmailLayout(`
        <p>Hi ${existing.name},</p>
        <p>Your ${region.brandName} account (${existing.email}) now has admin
        access. Log in as usual with your existing password to get
        started.</p>
      `),
    }).catch(() => {});

    revalidatePath("/admin/admins");
    return {};
  }

  const randomPassword = randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: "ADMIN" },
  });

  await logAudit({
    actorId: admin.id,
    action: "ADMIN_CREATED",
    targetType: "User",
    targetId: user.id,
  });

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
    subject: `You've been added as a ${region.brandName} admin`,
    html: baseEmailLayout(`
      <p>Hi ${user.name},</p>
      <p>You've been given admin access to ${region.brandName}. Set your
      password to get started:</p>
      <p><a href="${setPasswordUrl}" style="color:#C9A227;font-weight:bold;">Set your password</a></p>
      <p>This link expires in 7 days.</p>
    `),
  }).catch(() => {});

  revalidatePath("/admin/admins");
  return {};
}

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
    subject: `Set up your ${region.brandName} account`,
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

// One-off reminder of Tutor Agreement §6 (all communication, scheduling and
// payment must stay on the platform — no personal contact details, no
// off-platform arrangement) to every registered tutor. Failures per tutor
// don't stop the rest from sending — same pattern as other bulk email jobs
// (see the balance-reminder cron).
export async function sendTutorCommunicationPolicyReminder(): Promise<
  { error: string } | { sentCount: number }
> {
  const admin = await requireUser("ADMIN");

  const tutors = await prisma.user.findMany({
    where: { role: "TUTOR" },
    select: { id: true, name: true, email: true },
  });
  if (tutors.length === 0) {
    return { error: "There are no registered tutors to email." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const results = await Promise.allSettled(
    tutors.map((tutor) =>
      sendEmail({
        to: tutor.email,
        subject: "A reminder about keeping communication on the platform",
        html: baseEmailLayout(`
          <p>Hi ${tutor.name},</p>
          <p>A quick reminder of Section 6 of your Tutor Agreement: all
          communication with clients — including arranging or rescheduling
          sessions — must take place through the ${region.brandName}
          messaging system. Personal contact details shouldn't be requested
          or shared, and sessions or payment shouldn't be arranged outside
          the platform.</p>
          <p>This isn't just paperwork — it's what lets us keep a full
          audit trail and step in quickly if a safeguarding concern is ever
          raised, for your protection as much as the student's.</p>
          <p>You can review your signed Tutor Agreement any time from your
          compliance page:</p>
          <p><a href="${appUrl}/tutor-dashboard/compliance" style="color:#C9A227;font-weight:bold;">Review your Tutor Agreement</a></p>
          <p>Any questions about this, just reply to this email or contact
          us at ${region.supportEmail}.</p>
        `),
      }),
    ),
  );
  const sentCount = results.filter((r) => r.status === "fulfilled").length;

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_COMMUNICATION_POLICY_REMINDER_SENT",
    targetType: "User",
    metadata: { tutorCount: tutors.length, sentCount },
  });

  return { sentCount };
}
