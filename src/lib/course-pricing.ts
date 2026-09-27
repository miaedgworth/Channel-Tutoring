import type { CourseDayTrack } from "@prisma/client";

export interface PricingDay {
  id: string;
  pricePence: number;
  track: CourseDayTrack;
}

export interface PricingCourse {
  bundlePricePence: number | null;
  days: PricingDay[];
}

// A selection gets the bundle price once it covers every SCIENCE day plus
// at least one MATHS day (the October Half Term course: Biology, Chemistry,
// Physics + a choice of Foundation or Higher Maths, for £300). Any day
// beyond that — including a second MATHS day — is simply added at its own
// single-day price, so picking both Maths days plus all three sciences
// prices as the bundle plus one extra day, not five separate days.
// A selection that doesn't cover every SCIENCE day (or has no MATHS day at
// all) just sums each selected day's individual price — no bundle applies.
export function computeCoursePrice(
  course: PricingCourse,
  selectedDayIds: string[],
): { totalPence: number; bundleApplied: boolean } {
  const selected = new Set(selectedDayIds);
  const dayById = new Map(course.days.map((d) => [d.id, d]));

  const scienceDays = course.days.filter((d) => d.track === "SCIENCE");
  const mathsDaysSelected = course.days.filter(
    (d) => d.track === "MATHS" && selected.has(d.id),
  );
  const hasAllScience =
    scienceDays.length > 0 && scienceDays.every((d) => selected.has(d.id));

  if (hasAllScience && mathsDaysSelected.length >= 1 && course.bundlePricePence != null) {
    // Only the first selected Maths day is covered by the bundle — any
    // further Maths day selected is charged on top at its own price.
    const extraMathsPence = mathsDaysSelected
      .slice(1)
      .reduce((sum, d) => sum + d.pricePence, 0);
    return { totalPence: course.bundlePricePence + extraMathsPence, bundleApplied: true };
  }

  const totalPence = [...selected].reduce((sum, id) => {
    const day = dayById.get(id);
    return day ? sum + day.pricePence : sum;
  }, 0);
  return { totalPence, bundleApplied: false };
}

export function splitDepositAndBalance(
  totalPence: number,
  depositPercent: number,
): { depositPence: number; balancePence: number } {
  const depositPence = Math.round((totalPence * depositPercent) / 100);
  return { depositPence, balancePence: totalPence - depositPence };
}
