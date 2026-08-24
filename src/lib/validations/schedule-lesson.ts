import { z } from "zod";

export const logCompletedLessonSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  date: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 60 * 60 * 1000, {
    message: "The lesson date can't be in the future",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type LogCompletedLessonInput = z.infer<typeof logCompletedLessonSchema>;
