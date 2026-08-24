import { z } from "zod";

export const scheduleLessonSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Choose a future date and time",
  }),
  durationMinutes: z.coerce.number().int().refine((v) => [30, 45, 60, 90, 120].includes(v), {
    message: "Choose a valid duration",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type ScheduleLessonInput = z.infer<typeof scheduleLessonSchema>;
