import { z } from "zod";

export const setSlotSchema = z.object({
  dayOfWeek: z.enum([
    "MONDAY",
    "TUESDAY",
    "WEDNESDAY",
    "THURSDAY",
    "FRIDAY",
    "SATURDAY",
    "SUNDAY",
  ]),
  period: z.enum(["MORNING", "AFTERNOON", "EVENING"]),
  enabled: z.boolean(),
});

export type SetSlotInput = z.infer<typeof setSlotSchema>;
