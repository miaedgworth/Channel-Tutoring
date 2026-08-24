import { z } from "zod";

export const createSlotSchema = z.object({
  date: z.coerce.date().refine((d) => d.getTime() >= new Date().setHours(0, 0, 0, 0), {
    message: "Choose today or a future date",
  }),
  period: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
