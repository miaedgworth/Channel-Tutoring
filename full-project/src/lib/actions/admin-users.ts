"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { logAudit } from "@/lib/audit";

export async function setUserStatus(userId: string, status: "ACTIVE" | "SUSPENDED") {
  const admin = await requireUser("ADMIN");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found.");
  if (user.role === "ADMIN") throw new Error("Admin accounts can't be suspended here.");

  await prisma.user.update({ where: { id: userId }, data: { status } });

  await logAudit({
    actorId: admin.id,
    action: status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED",
    targetType: "User",
    targetId: userId,
  });

  revalidatePath("/admin/tutors");
  revalidatePath("/admin/clients");
}

export async function setTutorPublished(tutorProfileId: string, isPublished: boolean) {
  const admin = await requireUser("ADMIN");

  const profile = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
  if (!profile) throw new Error("Tutor profile not found.");

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
}

export async function setTutorDbsStatus(
  tutorProfileId: string,
  dbsStatus: "NOT_PROVIDED" | "PENDING" | "VERIFIED",
) {
  const admin = await requireUser("ADMIN");

  const profile = await prisma.tutorProfile.findUnique({ where: { id: tutorProfileId } });
  if (!profile) throw new Error("Tutor profile not found.");

  await prisma.tutorProfile.update({
    where: { id: tutorProfileId },
    data: { dbsStatus },
  });

  await logAudit({
    actorId: admin.id,
    action: "TUTOR_DBS_STATUS_UPDATED",
    targetType: "TutorProfile",
    targetId: tutorProfileId,
    metadata: { dbsStatus },
  });

  revalidatePath("/admin/tutors");
}
