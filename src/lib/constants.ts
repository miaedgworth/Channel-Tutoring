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

export const SESSION_MODE_LABELS: Record<string, string> = {
  ONLINE: "Online",
  IN_PERSON: "In person",
  BOTH: "Online or in person",
};

export const DBS_STATUS_LABELS: Record<string, string> = {
  NOT_PROVIDED: "Not provided",
  PENDING: "Pending check",
  VERIFIED: "Verified",
};

export const PLATFORM_FEE_PENCE = Number(process.env.PLATFORM_FEE_PENCE ?? 1500);

// What a tutor is paid per level, after the platform fee. Shown to tutors
// instead of the fee amount itself.
export const TUTOR_PAYOUT_PENCE: Record<string, number> = Object.fromEntries(
  Object.entries(LEVEL_PRICE_PENCE).map(([level, price]) => [level, price - PLATFORM_FEE_PENCE]),
);

// Group lessons: extra per-hour charge for each additional student beyond
// the first, on top of the one-to-one session price.
export const ADDITIONAL_STUDENT_SURCHARGE_PENCE = 700;

export const CANCELLATION_PARTIAL_REFUND_RATE = 0.5;
