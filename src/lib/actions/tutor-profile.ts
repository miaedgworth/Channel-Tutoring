"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { tutorProfileSchema, type TutorProfileInput } from "@/lib/validations/tutor-profile";
import { logAudit } from "@/lib/audit";

export async function updateTutorProfile(input: TutorProfileInput) {
  const user = await requireUser("TUTOR");
  const parsed = tutorProfileSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("Tutor profile not found.");

  const data = parsed.data;

  if (data.isPublished && profile.dbsStatus !== "VERIFIED") {
    throw new Error(
      "Your profile can't go live until your DBS check has been verified by our team.",
    );
  }

  await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: {
      headline: data.headline,
      bio: data.bio,
      photoUrl: data.photoUrl || null,
      subjects: data.subjects,
      levels: data.levels,
      yearsExperience: data.yearsExperience,
      qualifications: data.qualifications,
      isPublished: data.isPublished,
    },
  });

  await logAudit({
    actorId: user.id,
    action: "TUTOR_PROFILE_UPDATED",
    targetType: "TutorProfile",
    targetId: profile.id,
    metadata: { isPublished: data.isPublished },
  });

  revalidatePath("/tutor-dashboard/profile");
  revalidatePath(`/tutors/${profile.slug}`);
}
