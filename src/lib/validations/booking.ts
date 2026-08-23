import { z } from "zod";

export const createBookingSchema = z.object({
  slotId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["GCSE", "A_LEVEL"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
