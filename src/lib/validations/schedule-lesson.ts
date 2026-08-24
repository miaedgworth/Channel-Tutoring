import { z } from "zod";

export const scheduleLessonSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  dates: z
    .array(
      z.coerce.date().refine((d) => d.getTime() > Date.now(), {
        message: "Choose a future date and time",
      }),
    )
    .min(1, "Add at least one session")
    .max(20, "You can schedule at most 20 sessions in one block"),
  durationMinutes: z.coerce.number().int().refine((v) => [30, 45, 60, 90, 120].includes(v), {
    message: "Choose a valid duration",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ScheduleLessonInput = z.infer<typeof scheduleLessonSchema>;
