import { z } from "zod";

export const courseSchema = z.object({
  title: z.string().trim().min(3, "Add a title").max(150),
  description: z.string().trim().min(10, "Add a short description").max(3000),
  status: z.enum(["UPCOMING", "PAST"]),
  startDate: z.string().trim().optional().or(z.literal("")),
  endDate: z.string().trim().optional().or(z.literal("")),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const courseInterestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CourseInterestInput = z.infer<typeof courseInterestSchema>;
