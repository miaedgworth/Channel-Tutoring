import { prisma } from "@/lib/prisma";

// A day's capacity is only ever checked against enrollments that have
// actually paid a deposit — someone who starts checkout and abandons it
// doesn't permanently occupy a seat. This is a best-effort guard, not a
// hard DB constraint (same tradeoff as hasSchedulingConflict in
// booking-conflicts.ts): two people finishing checkout for the last spot
// at the exact same moment could both succeed. Acceptable for a
// capacity-limited in-person day, not a financial invariant.
export async function getDaysSpotsTaken(dayIds: string[]): Promise<Map<string, number>> {
  if (dayIds.length === 0) return new Map();
  const rows = await prisma.courseEnrollmentDay.groupBy({
    by: ["dayId"],
    where: { dayId: { in: dayIds }, enrollment: { depositStatus: "PAID" } },
    _count: { _all: true },
  });
  return new Map(rows.map((r) => [r.dayId, r._count._all]));
}

export interface DayAvailability {
  dayId: string;
  capacity: number | null;
  spotsTaken: number;
  spotsLeft: number | null;
  soldOut: boolean;
}

export async function getDaysAvailability(
  days: { id: string; capacity: number | null }[],
): Promise<Map<string, DayAvailability>> {
  const spotsTakenByDay = await getDaysSpotsTaken(days.map((d) => d.id));
  return new Map(
    days.map((d) => {
      const spotsTaken = spotsTakenByDay.get(d.id) ?? 0;
      const spotsLeft = d.capacity == null ? null : Math.max(0, d.capacity - spotsTaken);
      return [
        d.id,
        {
          dayId: d.id,
          capacity: d.capacity,
          spotsTaken,
          spotsLeft,
          soldOut: d.capacity != null && spotsTaken >= d.capacity,
        },
      ];
    }),
  );
}
