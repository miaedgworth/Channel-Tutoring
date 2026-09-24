import { z } from "zod";

export const courseTestimonialSchema = z.object({
  studentName: z.string().trim().min(2, "Enter a name").max(100),
  role: z.string().trim().max(100).optional().or(z.literal("")),
  subject: z.string().trim().max(100).optional().or(z.literal("")),
  quote: z.string().trim().min(5, "Enter the testimonial text").max(1000),
  rating: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine(
      (val) => !val || (Number.isInteger(Number(val)) && Number(val) >= 1 && Number(val) <= 5),
      "Enter a whole number between 1 and 5",
    ),
  courseId: z.string().trim().optional().or(z.literal("")),
  featured: z.boolean().default(true),
});

export type CourseTestimonialInput = z.infer<typeof courseTestimonialSchema>;
