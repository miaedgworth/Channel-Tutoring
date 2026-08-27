import { z } from "zod";

export const feedbackSchema = z.object({
  clientName: z.string().trim().min(1, "Please enter your name").max(100),
  tutorName: z.string().trim().min(1, "Please enter your tutor's name").max(100),
  rating: z.coerce
    .number()
    .int()
    .min(1, "Please choose a star rating")
    .max(5, "Please choose a star rating"),
  helpfulText: z.string().trim().min(3, "Let us know what you found helpful").max(2000),
  improveText: z.string().trim().max(2000).optional().or(z.literal("")),
  consentToShare: z.boolean().default(false),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;
