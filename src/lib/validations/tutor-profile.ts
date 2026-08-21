import { z } from "zod";

export const tutorProfileSchema = z.object({
  headline: z.string().trim().min(5, "Add a short headline").max(120),
  bio: z.string().trim().min(50, "Write at least a short paragraph (50+ characters)").max(3000),
  photoUrl: z.string().trim().url().optional().or(z.literal("")),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  levels: z.array(z.enum(["GCSE", "A_LEVEL"])).min(1, "Select at least one level"),
  examBoards: z.array(z.string()).default([]),
  hourlyRatePence: z.coerce.number().int().min(500, "Minimum rate is £5/hour").max(50000),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  qualifications: z.string().trim().min(3).max(1000),
  isPublished: z.boolean().default(false),
});

export type TutorProfileInput = z.infer<typeof tutorProfileSchema>;
