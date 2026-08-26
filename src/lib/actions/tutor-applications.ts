"use server";

import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { uniqueTutorSlug } from "@/lib/slug";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { logAudit } from "@/lib/audit";
import { adminCreateTutorSchema, type AdminCreateTutorInput } from "@/lib/validations/admin-create-tutor";

export async function approveTutorApplication(
  applicationId: string,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const application = await prisma.tutorApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application || application.status !== "PENDING") {
    return { error: "This application has already been reviewed." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: application.email },
  });

  if (existingUser && existingUser.role === "TUTOR") {
    return { error: "A tutor account already exists for this email." };
  }
  if (existingUser && existingUser.role === "ADMIN") {
    return { error: "This email belongs to an admin account." };
  }

  const slug = await uniqueTutorSlug(application.name);
  const randomPassword = randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  let user;
  try {
    user = await prisma.$transaction(async (tx) => {
      // Atomically claim the application before doing anything else — the
      // conditional update only affects the row while it's still PENDING,
      // so two concurrent approvals of the same application (a double
      // click, a retried request) can't both create a tutor account for
      // it. Whichever transaction commits first wins; the other's claim
      // affects zero rows and aborts here instead of hitting a duplicate
      // TutorProfile/slug constraint mid-transaction.
      const claimed = await tx.tutorApplication.updateMany({
        where: { id: application.id, status: "PENDING" },
        data: { status: "APPROVED", reviewedById: admin.id, reviewedAt: new Date() },
      });
      if (claimed.count === 0) {
        throw new Error("This application has already been reviewed.");
      }

      const user = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: { role: "TUTOR" },
          })
        : await tx.user.create({
            data: {
              name: application.name,
              email: application.email,
              phone: application.phone,
              passwordHash,
              role: "TUTOR",
            },
          });

      await tx.tutorProfile.create({
        data: {
          userId: user.id,
          slug,
          headline: `${application.subjects[0] ?? "Tutor"} Tutor`,
          bio: application.bio,
          subjects: application.subjects,
          levels: application.levels,
          qualifications: application.qualifications,
          isPublished: false,
        },
      });

      await tx.tutorApplication.update({
        where: { id: application.id },
        data: { userId: user.id },
      });

      return user;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." };
  }

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
    subject: "You're approved to tutor with Channel Tutoring!",
    html: baseEmailLayout(`
      <p>Hi ${application.name},</p>
      <p>Great news — your application to tutor with Channel Tutoring has
      been approved.</p>
      <p>Set a password to access your tutor dashboard and complete your
      public profile:</p>
      <p><a href="${setPasswordUrl}" style="color:#C9A227;font-weight:bold;">Set your password</a></p>
      <p>This link expires in 7 days. Once you're in, don't forget to
      publish your profile so clients can find you.</p>
    `),
  }).catch(() => {});

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_APPLICATION_APPROVED",
    targetType: "TutorApplication",
    targetId: application.id,
    metadata: { tutorUserId: user.id },
  });

  revalidatePath("/admin/tutor-applications");

  return {};
}

export async function adminCreateTutor(
  input: AdminCreateTutorInput,
): Promise<{ error: string; slug?: undefined } | { error?: undefined; slug: string }> {
  const admin = await requireUser("ADMIN");
  const parsed = adminCreateTutorSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
  if (existingUser) {
    return { error: "An account with that email already exists." };
  }

  const slug = await uniqueTutorSlug(data.name);
  const randomPassword = randomBytes(24).toString("hex");
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        passwordHash,
        role: "TUTOR",
      },
    });

    await tx.tutorProfile.create({
      data: {
        userId: user.id,
        slug,
        headline: data.headline,
        bio: data.bio,
        subjects: data.subjects,
        levels: data.levels,
        qualifications: data.qualifications,
        sessionMode: data.sessionMode,
        isPublished: false,
      },
    });

    return user;
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
    subject: "You're set up to tutor with Channel Tutoring!",
    html: baseEmailLayout(`
      <p>Hi ${data.name},</p>
      <p>An account has been created for you to tutor with Channel Tutoring.</p>
      <p>Set a password to access your tutor dashboard and complete your
      public profile:</p>
      <p><a href="${setPasswordUrl}" style="color:#C9A227;font-weight:bold;">Set your password</a></p>
      <p>This link expires in 7 days. Once you're in, don't forget to
      publish your profile so clients can find you.</p>
    `),
  }).catch(() => {});

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_CREATED_BY_ADMIN",
    targetType: "User",
    targetId: user.id,
  });

  revalidatePath("/admin/tutors");

  return { slug };
}

export async function rejectTutorApplication(
  applicationId: string,
  reason: string,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const application = await prisma.tutorApplication.findUnique({
    where: { id: applicationId },
  });
  if (!application || application.status !== "PENDING") {
    return { error: "This application has already been reviewed." };
  }

  await prisma.tutorApplication.update({
    where: { id: application.id },
    data: {
      status: "REJECTED",
      rejectionReason: reason || null,
      reviewedById: admin.id,
      reviewedAt: new Date(),
    },
  });

  await sendEmail({
    to: application.email,
    subject: "Update on your Channel Tutoring application",
    html: baseEmailLayout(`
      <p>Hi ${application.name},</p>
      <p>Thank you for your interest in tutoring with Channel Tutoring.
      After review, we're not able to move forward with your application
      at this time.</p>
      ${reason ? `<p>${reason}</p>` : ""}
      <p>You're welcome to apply again in future if your circumstances
      change.</p>
    `),
  }).catch(() => {});

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_APPLICATION_REJECTED",
    targetType: "TutorApplication",
    targetId: application.id,
    metadata: { reason },
  });

  revalidatePath("/admin/tutor-applications");

  return {};
}
