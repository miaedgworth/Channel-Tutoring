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

export const DBS_STATUS_LABELS: Record<string, string> = {
  NOT_PROVIDED: "Not provided",
  PENDING: "Pending check",
  VERIFIED: "Verified",
};

export const PLATFORM_FEE_PENCE = Number(process.env.PLATFORM_FEE_PENCE ?? 1500);

// Book and pay for this many sessions with the same tutor/subject/level in
// one go to receive the block-booking discount.
export const BLOCK_BOOKING_MIN_SESSIONS = 5;
export const BLOCK_BOOKING_DISCOUNT_RATE = 0.1;

// Group lessons: extra per-hour charge for each additional student beyond
// the first, on top of the one-to-one session price.
export const ADDITIONAL_STUDENT_SURCHARGE_PENCE = 700;

export const CANCELLATION_PARTIAL_REFUND_RATE = 0.5;
