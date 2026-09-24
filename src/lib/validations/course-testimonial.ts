import { z } from "zod";

export const courseTestimonialSchema = z.object({
  studentName: z.string().trim().min(2, "Enter a name").max(100),
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
});

export type CourseTestimonialInput = z.infer<typeof courseTestimonialSchema>;
