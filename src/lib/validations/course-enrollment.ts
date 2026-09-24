import { z } from "zod";
import { COURSE_CHILD_QUESTIONS } from "@/lib/constants";

export const courseEnrollmentSchema = z.object({
  dayIds: z.array(z.string().cuid()).min(1, "Select at least one day"),
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
});

export type CourseEnrollmentInput = z.infer<typeof courseEnrollmentSchema>;

// Cross-checks childAnswers against COURSE_CHILD_QUESTIONS' required flags —
// kept separate from the zod shape above since the question set (and which
// answers are required) is data-driven, not fixed at the schema level.
export function findMissingRequiredAnswer(
  childAnswers: Record<string, string>,
): string | null {
  for (const q of COURSE_CHILD_QUESTIONS) {
    if (q.required && !childAnswers[q.id]?.trim()) {
      return q.label;
    }
  }
  return null;
}
