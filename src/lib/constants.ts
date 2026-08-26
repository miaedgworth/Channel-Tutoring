export const SUBJECTS = [
  "Maths",
  "Further Maths",
  "English Language",
  "English Literature",
  "Biology",
  "Chemistry",
  "Physics",
  "Combined Science",
  "Computer Science",
  "History",
  "Geography",
  "French",
  "Spanish",
  "German",
  "Economics",
  "Business Studies",
  "Psychology",
  "Sociology",
  "Religious Studies",
  "Art & Design",
  "Music",
  "Politics",
  "Law",
] as const;

export const EXAM_BOARDS = [
  "AQA",
  "Edexcel",
  "OCR",
  "WJEC / Eduqas",
  "CIE",
  "SQA",
] as const;

export const LEVELS = [
  { value: "KS3", label: "KS3 (Years 7-9)" },
  { value: "GCSE", label: "GCSE (Years 10-11)" },
  { value: "A_LEVEL", label: "A-Level (Years 12-13)" },
  { value: "UNIVERSITY_ADMISSIONS", label: "University Admissions / Interview Technique" },
] as const;

// Short labels for compact UI (badges, price lists) — LEVELS above has the
// longer descriptive labels for filter/form dropdowns.
export const LEVEL_LABELS: Record<string, string> = {
  KS3: "KS3",
  GCSE: "GCSE",
  A_LEVEL: "A-Level",
  UNIVERSITY_ADMISSIONS: "University Admissions",
};

// Fixed session pricing by level. Every tutor charges the same rate for the
// same level — see the Channel Tutoring Registration and Agreement Form.
export const LEVEL_PRICE_PENCE: Record<string, number> = {
  KS3: 3500,
  GCSE: 4000,
  A_LEVEL: 4500,
  UNIVERSITY_ADMISSIONS: 5000,
};

export const AVAILABILITY_PERIODS = [
  { value: "MORNING", label: "Morning" },
  { value: "AFTERNOON", label: "Afternoon" },
  { value: "EVENING", label: "Evening" },
] as const;

export const AVAILABILITY_PERIOD_LABELS: Record<string, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

export const DAYS_OF_WEEK = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
] as const;

export const DAY_OF_WEEK_LABELS: Record<string, string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
  SATURDAY: "Saturday",
  SUNDAY: "Sunday",
};

export const SESSION_MODE_LABELS: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "In person",
  BOTH: "Online or in person",
};

export const PLATFORM_FEE_PENCE = Number(process.env.PLATFORM_FEE_PENCE ?? 1500);

// What a tutor is paid per level, after the platform fee. Shown to tutors
// instead of the fee amount itself.
export const TUTOR_PAYOUT_PENCE: Record<string, number> = Object.fromEntries(
  Object.entries(LEVEL_PRICE_PENCE).map(([level, price]) => [level, price - PLATFORM_FEE_PENCE]),
);

// Buy this many or more lesson tokens for a level in one purchase to get a
// discount on the whole purchase. Comes entirely out of the platform's fee —
// tutors are always paid as if there were no discount when a token is
// redeemed.
export const BLOCK_BOOKING_MIN_SESSIONS = 5;
export const BLOCK_BOOKING_DISCOUNT_RATE = 0.1;

// A token is redeemable against one lesson of this length, at the token's
// level. Matches the per-hour pricing shown on the Pricing page.
export const TOKEN_LESSON_DURATION_MINUTES = 60;

// Group lessons: extra per-hour charge for each additional student beyond
// the first, on top of the one-to-one session price.
export const ADDITIONAL_STUDENT_SURCHARGE_PENCE = 700;

// How long after a tutor logs a completed lesson they (or an admin) can
// undo it, refunding the token.
export const LESSON_LOG_UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;
