import { z } from "zod";
import type { CourseDayTrack } from "@prisma/client";
import { COURSE_CHILD_QUESTIONS } from "@/lib/constants";

export const courseEnrollmentSchema = z.object({
  // Not validated as a cuid here — some CourseDay rows were seeded with
  // plain UUIDs rather than Prisma-generated cuids, so this only checks
  // for a non-empty id. The real check is membership in the course's own
  // day set, done server-side in createCourseEnrollment.
  dayIds: z.array(z.string().min(1)).min(1, "Select at least one day"),
  childName: z.string().trim().min(2, "Please enter your child's name").max(150),
  childAnswers: z.record(z.string(), z.string().trim().max(2000)),
  termsSignedName: z
    .string()
    .trim()
    .min(2, "Type your full name to sign the terms")
    .max(150),
  agreedToTerms: z.literal(true, {
    message: "You must agree to the Course Terms & Conditions to enrol.",
  }),
  // Only required when booking as a guest (no account) — createCourseEnrollment
  // checks that itself, since whether one's needed depends on the session,
  // not on the shape of the input alone.
  guestName: z.string().trim().min(2, "Enter your name").max(150).optional(),
  guestEmail: z.string().trim().toLowerCase().email("Enter a valid email address").max(200).optional(),
  guestPhone: z.string().trim().max(50).optional(),
});

export type CourseEnrollmentInput = z.infer<typeof courseEnrollmentSchema>;

// Confirms a guest's identity on the pay-balance page — there's no access
// token for a guest booking, so this email (matched against
// CourseEnrollment.guestEmail) is what proves it's their booking.
export const guestBalancePaymentSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
});

// Admin-entered booking for someone who paid/booked outside the website
// (phone, in person, bank transfer) — a trimmed-down version of the public
// wizard's fields, since there's no Stripe checkout or full consent form
// involved. Price is still computed from the real day/bundle pricing (see
// createManualCourseEnrollment), never typed in by the admin.
export const manualCourseEnrollmentSchema = z.object({
  dayIds: z.array(z.string().min(1)).min(1, "Select at least one day"),
  childName: z.string().trim().min(2, "Enter the child's name").max(150),
  guardianName: z.string().trim().min(2, "Enter the parent/guardian's name").max(150),
  guardianEmail: z.string().trim().max(200).optional(),
  guardianPhone: z.string().trim().max(50).optional(),
  notes: z.string().trim().max(2000).optional(),
  depositStatus: z.enum(["PENDING", "PAID"]),
  balanceStatus: z.enum(["PENDING", "PAID"]),
});

export type ManualCourseEnrollmentInput = z.infer<typeof manualCourseEnrollmentSchema>;

// Cross-checks childAnswers against COURSE_CHILD_QUESTIONS' required flags —
// kept separate from the zod shape above since the question set (and which
// answers are required) is data-driven, not fixed at the schema level. A
// question with showIfTrack is only enforced once the booking includes a
// day of that track (e.g. no Science day selected means the Science exam
// board question doesn't apply, so it isn't required).
export function findMissingRequiredAnswer(
  childAnswers: Record<string, string>,
  selectedTracks: Set<CourseDayTrack>,
): string | null {
  for (const q of COURSE_CHILD_QUESTIONS) {
    if (!q.required) continue;
    if (q.showIfTrack && !selectedTracks.has(q.showIfTrack)) continue;
    if (!childAnswers[q.id]?.trim()) {
      return q.label;
    }
  }
  return null;
}
