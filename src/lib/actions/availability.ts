"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { createSlotSchema } from "@/lib/validations/availability";
import { PLATFORM_FEE_PENCE } from "@/lib/constants";

export async function createAvailabilitySlot(input: {
  startsAt: string;
  durationMinutes: number;
}) {
  const user = await requireUser("TUTOR");
  const parsed = createSlotSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("Tutor profile not found.");

  const { startsAt, durationMinutes } = parsed.data;
  const endsAt = new Date(startsAt.getTime() + durationMinutes * 60 * 1000);

  const sessionPrice = Math.round((profile.hourlyRatePence * durationMinutes) / 60);
  if (sessionPrice <= PLATFORM_FEE_PENCE) {
    throw new Error(
      `At your current rate, a ${durationMinutes}-minute session doesn't cover the platform fee. Increase your hourly rate or choose a longer duration.`,
    );
  }

  const overlapping = await prisma.tutorAvailabilitySlot.findFirst({
    where: {
      tutorId: profile.id,
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (overlapping) {
    throw new Error("This overlaps with an existing availability slot.");
  }

  await prisma.tutorAvailabilitySlot.create({
    data: { tutorId: profile.id, startsAt, endsAt },
  });

  revalidatePath("/tutor-dashboard/availability");
}

export async function deleteAvailabilitySlot(slotId: string) {
  const user = await requireUser("TUTOR");
  const profile = await prisma.tutorProfile.findUnique({ where: { userId: user.id } });
  if (!profile) throw new Error("Tutor profile not found.");

  const slot = await prisma.tutorAvailabilitySlot.findUnique({ where: { id: slotId } });
  if (!slot || slot.tutorId !== profile.id) {
    throw new Error("Slot not found.");
  }
  if (slot.isBooked) {
    throw new Error("This slot is already booked and can't be removed.");
  }

  await prisma.tutorAvailabilitySlot.delete({ where: { id: slotId } });
  revalidatePath("/tutor-dashboard/availability");
}
