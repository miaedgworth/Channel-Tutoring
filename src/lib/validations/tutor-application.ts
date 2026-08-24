import { z } from "zod";

const LEVEL_VALUES = ["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"] as const;

export const tutorApplicationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().min(6, "Enter a valid phone number").max(30),
  subjects: z.array(z.string()).min(1, "Select at least one subject"),
  levels: z.array(z.enum(LEVEL_VALUES)).min(1, "Select at least one level"),
  qualifications: z.string().trim().min(5, "Tell us about your qualifications").max(1000),
  dbsStatus: z.enum(["NOT_PROVIDED", "PENDING", "VERIFIED"]).default("NOT_PROVIDED"),
  cvUrl: z.string().trim().url().optional().or(z.literal("")),
  referenceUrl: z.string().trim().url().optional().or(z.literal("")),
  bio: z.string().trim().min(50, "Please write at least a short paragraph (50+ characters)").max(2000),
  availabilityNotes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type TutorApplicationInput = z.infer<typeof tutorApplicationSchema>;
