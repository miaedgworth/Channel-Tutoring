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
});

export type AdminScheduleSessionInput = z.infer<typeof adminScheduleSessionSchema>;

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
