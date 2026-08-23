import { z } from "zod";

export const createSlotSchema = z.object({
  startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Start time must be in the future",
  }),
  durationMinutes: z.coerce.number().int().refine((v) => [30, 45, 60, 90, 120].includes(v), {
    message: "Choose a valid duration",
  }),
});

export type CreateSlotInput = z.infer<typeof createSlotSchema>;
