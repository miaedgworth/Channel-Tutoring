"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { createSlotSchema } from "@/lib/validations/availability";

export async function createAvailabilitySlot(input: { date: string; period: string }) {
  const user = await requireUser("TUTOR");
  const parsed = createSlotSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("Tutor profile not found.");

  const { date, period } = parsed.data;

  const existing = await prisma.tutorAvailabilitySlot.findUnique({
    where: { tutorId_date_period: { tutorId: profile.id, date, period } },
  });
  if (existing) {
    throw new Error("You've already marked yourself available for this day and period.");
  }

  await prisma.tutorAvailabilitySlot.create({
    data: { tutorId: profile.id, date, period },
  });

  revalidatePath("/tutor-dashboard/availability");
  revalidatePath(`/tutors/${profile.slug}`);
}

export async function deleteAvailabilitySlot(slotId: string) {
  const user = await requireUser("TUTOR");
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("Tutor profile not found.");

  const slot = await prisma.tutorAvailabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.tutorId !== profile.id) {
    throw new Error("Slot not found.");
  }

  await prisma.tutorAvailabilitySlot.delete({ where: { id: slotId } });
  revalidatePath("/tutor-dashboard/availability");
  revalidatePath(`/tutors/${profile.slug}`);
}
