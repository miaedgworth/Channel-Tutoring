import { z } from "zod";

export const createBookingSchema = z.object({
  slotIds: z.array(z.string().min(1)).min(1).max(20),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
