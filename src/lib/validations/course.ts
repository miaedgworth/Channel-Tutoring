import { z } from "zod";

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || !Number.isNaN(Date.parse(val)), "Enter a valid date");

const optionalPositiveInt = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || (Number.isInteger(Number(val)) && Number(val) > 0), "Enter a whole number greater than 0");

export const courseSchema = z
  .object({
    title: z.string().trim().min(3, "Add a title").max(150),
    description: z.string().trim().min(10, "Add a short description").max(3000),
    status: z.enum(["UPCOMING", "PAST"]),
    startDate: optionalDateString,
    endDate: optionalDateString,
    venue: z.string().trim().max(200).optional().or(z.literal("")),
    timeLabel: z.string().trim().max(100).optional().or(z.literal("")),
    bundlePricePence: optionalPositiveInt,
    bundleLabel: z.string().trim().max(150).optional().or(z.literal("")),
    depositPercent: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .refine(
        (val) => !val || (Number.isInteger(Number(val)) && Number(val) > 0 && Number(val) <= 100),
        "Enter a whole number between 1 and 100",
      ),
    balanceDueDate: optionalDateString,
  })
  .refine(
    (data) => !data.startDate || !data.endDate || Date.parse(data.endDate) >= Date.parse(data.startDate),
    { message: "End date can't be before the start date", path: ["endDate"] },
  );

export type CourseInput = z.infer<typeof courseSchema>;

export const courseDaySchema = z.object({
  date: z.string().trim().refine((val) => !Number.isNaN(Date.parse(val)), "Enter a valid date"),
  label: z.string().trim().min(2, "Add a label").max(100),
  track: z.enum(["MATHS", "SCIENCE", "OTHER"]),
  pricePence: z
    .string()
    .trim()
    .refine((val) => Number.isInteger(Number(val)) && Number(val) > 0, "Enter a whole number of pence greater than 0"),
  sortOrder: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((val) => !val || Number.isInteger(Number(val)), "Enter a whole number"),
  capacity: optionalPositiveInt,
});

export type CourseDayInput = z.infer<typeof courseDaySchema>;

export const courseInterestSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CourseInterestInput = z.infer<typeof courseInterestSchema>;
