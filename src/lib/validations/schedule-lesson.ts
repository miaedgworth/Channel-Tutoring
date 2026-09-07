import { z } from "zod";
import { SESSION_DURATION_OPTIONS_MINUTES } from "@/lib/constants";

export const logCompletedLessonSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  durationMinutes: z.coerce
    .number()
    .refine((m) => (SESSION_DURATION_OPTIONS_MINUTES as readonly number[]).includes(m), {
      message: "Choose a valid session length",
    }),
  date: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 60 * 60 * 1000, {
    message: "The lesson date can't be in the future",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type LogCompletedLessonInput = z.infer<typeof logCompletedLessonSchema>;

// A series repeats weekly for this many occurrences (including the first) —
// 1 means a normal one-off session. Capped at a year's worth of weeks.
const repeatWeeksField = z.coerce.number().int().min(1).max(52).default(1);

export const scheduleSessionSchema = z.object({
  clientId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  durationMinutes: z.coerce
    .number()
    .refine((m) => (SESSION_DURATION_OPTIONS_MINUTES as readonly number[]).includes(m), {
      message: "Choose a valid session length",
    }),
  date: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Choose a date and time in the future",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  repeatWeeks: repeatWeeksField,
});

export type ScheduleSessionInput = z.infer<typeof scheduleSessionSchema>;

export const adminScheduleSessionSchema = z.object({
  clientId: z.string().min(1),
  tutorProfileId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  durationMinutes: z.coerce
    .number()
    .refine((m) => (SESSION_DURATION_OPTIONS_MINUTES as readonly number[]).includes(m), {
      message: "Choose a valid session length",
    }),
  date: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Choose a date and time in the future",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  repeatWeeks: repeatWeeksField,
});

export type AdminScheduleSessionInput = z.infer<typeof adminScheduleSessionSchema>;

export const adminLogCompletedLessonSchema = z.object({
  clientId: z.string().min(1),
  tutorProfileId: z.string().min(1),
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  durationMinutes: z.coerce
    .number()
    .refine((m) => (SESSION_DURATION_OPTIONS_MINUTES as readonly number[]).includes(m), {
      message: "Choose a valid session length",
    }),
  date: z.coerce.date().refine((d) => d.getTime() <= Date.now() + 60 * 60 * 1000, {
    message: "The lesson date can't be in the future",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type AdminLogCompletedLessonInput = z.infer<typeof adminLogCompletedLessonSchema>;

// Shared by both the admin and tutor "edit a scheduled session" actions —
// same editable fields either way, just a different owner check.
export const updateSessionSchema = z.object({
  subject: z.string().trim().min(1).max(60),
  level: z.enum(["KS3", "GCSE", "A_LEVEL", "UNIVERSITY_ADMISSIONS"]),
  examBoard: z.string().trim().max(60).optional().or(z.literal("")),
  sessionMode: z.enum(["ONLINE", "IN_PERSON"]),
  durationMinutes: z.coerce
    .number()
    .refine((m) => (SESSION_DURATION_OPTIONS_MINUTES as readonly number[]).includes(m), {
      message: "Choose a valid session length",
    }),
  date: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: "Choose a date and time in the future",
  }),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
