import { prisma } from "@/lib/prisma";

// Best-effort overlap guard, not a hard DB constraint — two truly
// simultaneous requests for the same tutor/slot could both pass this check
// before either commits. That's an acceptable gap for a UX guard against
// accidental double-booking (the common case: a tutor forgetting they
// already booked a slot), not a financial invariant like the token-balance
// checks elsewhere, which do use an atomic conditional update.
export async function hasSchedulingConflict(
  tutorId: string,
  startsAt: Date,
  endsAt: Date,
  excludeBookingId?: string,
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: {
      tutorId,
      status: "CONFIRMED",
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true },
  });
  return Boolean(conflict);
}
