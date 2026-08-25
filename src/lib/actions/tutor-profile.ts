"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { tutorProfileSchema, type TutorProfileInput } from "@/lib/validations/tutor-profile";
import { logAudit } from "@/lib/audit";

export async function updateTutorProfile(
  input: TutorProfileInput,
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");
  const parsed = tutorProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Tutor profile not found." };

  const data = parsed.data;

  await prisma.tutorProfile.update({
    where: { id: profile.id },
    data: {
      headline: data.headline,
      bio: data.bio,
      photoUrl: data.photoUrl || null,
      subjects: data.subjects,
      levels: data.levels,
      qualifications: data.qualifications,
      sessionMode: data.sessionMode,
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

  return {};
}
