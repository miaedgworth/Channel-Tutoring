import { z } from "zod";

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), "Enter a valid date");

export const courseSchema = z
  .object({
    title: z.string().trim().min(3, "Add a title").max(150),
    description: z.string().trim().min(10, "Add a short description").max(3000),
    status: z.enum(["UPCOMING", "PAST"]),
    startDate: optionalDateString,
    endDate: optionalDateString,
  })
  .refine(
    (data) => !data.startDate || !data.endDate || Date.parse(data.endDate) >= Date.parse(data.startDate),
    { message: "End date can't be before the start date", path: ["endDate"] },
  );

export type CourseInput = z.infer<typeof courseSchema>;

export const courseInterestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CourseInterestInput = z.infer<typeof courseInterestSchema>;
