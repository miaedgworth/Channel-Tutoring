"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { setSlotSchema } from "@/lib/validations/availability";

export async function setAvailabilitySlot(
  input: { dayOfWeek: string; period: string; enabled: boolean },
): Promise<{ error: string } | { error?: undefined }> {
  const user = await requireUser("TUTOR");
  const parsed = setSlotSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) return { error: "Tutor profile not found." };

  const { dayOfWeek, period, enabled } = parsed.data;

  if (enabled) {
    await prisma.tutorAvailabilitySlot.upsert({
      where: { tutorId_dayOfWeek_period: { tutorId: profile.id, dayOfWeek, period } },
      create: { tutorId: profile.id, dayOfWeek, period },
      update: {},
    });
  } else {
    await prisma.tutorAvailabilitySlot.deleteMany({
      where: { tutorId: profile.id, dayOfWeek, period },
    });
  }

  revalidatePath("/tutor-dashboard/availability");
  revalidatePath(`/tutors/${profile.slug}`);

  return {};
}
