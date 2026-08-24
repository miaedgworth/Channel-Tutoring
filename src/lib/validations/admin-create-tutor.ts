import { z } from "zod";

const LEVEL_VALUES = ["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"] as const;

export const adminCreateTutorSchema = z.object({
  name: z.string().trim().min(2, "Enter a full name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  headline: z.string().trim().min(5, "Add a short headline").max(120),
  bio: z.string().trim().min(50, "Write at least a short paragraph (50+ characters)").max(3000),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  levels: z.array(z.enum(LEVEL_VALUES)).min(1, "Select at least one level"),
  qualifications: z.string().trim().min(3).max(1000),
  sessionMode: z.enum(["ONLINE", "IN_PERSON", "BOTH"]),
  dbsStatus: z.enum(["NOT_PROVIDED", "PENDING", "VERIFIED"]).default("NOT_PROVIDED"),
});

export type AdminCreateTutorInput = z.infer<typeof adminCreateTutorSchema>;
