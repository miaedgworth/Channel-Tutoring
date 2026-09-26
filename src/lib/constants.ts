import { REGION, type RegionId } from "@/lib/region";

export const SUBJECTS = [
  "Maths",
  "Further Maths",
  "Statistics",
  "English Language",
  "English Literature",
  "Essay Writing",
  "Biology",
  "Chemistry",
  "Physics",
  "Combined Science",
  "Environmental Science",
  "Computer Science",
  "History",
  "Geography",
  "Classics",
  "Latin",
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
  "Theatre Studies",
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

// Fixed session pricing by level, in the region's minor currency unit
// (pence for GBP, rappen for CHF). Every tutor charges the same rate for
// the same level — see the Registration and Agreement Form.
//
// The CH figures are a placeholder (same numbers as GG, just relabelled
// CHF) — Mia needs to confirm real Swiss market pricing before launch.
const LEVEL_PRICE_PENCE_BY_REGION: Record<RegionId, Record<string, number>> = {
  GG: {
    KS3: 3500,
    GCSE: 4000,
    A_LEVEL: 4500,
    UNIVERSITY_ADMISSIONS: 5000,
  },
  CH: {
    KS3: 3500,
    GCSE: 4000,
    A_LEVEL: 4500,
    UNIVERSITY_ADMISSIONS: 5000,
  },
};

export const LEVEL_PRICE_PENCE: Record<string, number> = LEVEL_PRICE_PENCE_BY_REGION[REGION];

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

export const MAX_ATTACHMENT_SIZE_BYTES = 15 * 1024 * 1024;

export const ALLOWED_ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
] as const;

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

// A token is redeemable against one hour of tuition, at the token's level —
// matches the per-hour pricing shown on the Pricing page. Session length is
// customisable; the tokens (and price) used scale with the length, e.g. a
// 1.5-hour session uses 1.5 tokens.
export const TOKEN_LESSON_DURATION_MINUTES = 60;

export const SESSION_DURATION_OPTIONS_MINUTES = [30, 45, 60, 90, 120] as const;

export function formatSessionDuration(minutes: number): string {
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? "" : "s"}`;
  if (minutes < 60) return `${minutes} minutes`;
  return `${(minutes / 60).toFixed(1)} hours`;
}

// Group lessons: extra per-hour charge for each additional student beyond
// the first, on top of the one-to-one session price.
export const ADDITIONAL_STUDENT_SURCHARGE_PENCE = 700;

// How long after a tutor logs a completed lesson they (or an admin) can
// undo it, refunding the token.
export const LESSON_LOG_UNDO_WINDOW_MS = 24 * 60 * 60 * 1000;

// Shown as the "Last updated" date on the Tutor Agreement, and stamped on
// every signature so admin can see which version of the agreement a given
// signature actually applied to. Bump this whenever the agreement's terms
// change.
export const TUTOR_AGREEMENT_VERSION = "26 August 2026";

// Same pattern as TUTOR_AGREEMENT_VERSION, for the Course Terms &
// Conditions signed at course-enrollment checkout. Bump whenever the terms
// text in src/components/legal/course-terms-content.tsx changes.
export const COURSE_TERMS_VERSION = "25 September 2026";

// Used when a course doesn't set its own Course.depositPercent.
export const DEFAULT_COURSE_DEPOSIT_PERCENT = 25;

// Promo codes for course bookings, scoped to a specific course by slug so
// one doesn't silently carry over to a future course without a deliberate
// decision to add it there too. Applied to the total booking price before
// it's split into deposit/balance (see splitDepositAndBalance), so both the
// deposit paid now and the balance paid later reflect the discount — not
// just a Stripe coupon on the deposit line item. Not a secret: shared with
// the client so the wizard can preview the discount before submitting, but
// the server always re-validates and recomputes the price itself.
export interface CoursePromoCode {
  code: string;
  percentOff: number;
  courseSlug: string;
}

export const COURSE_PROMO_CODES: CoursePromoCode[] = [
  { code: "CHANNEL10", percentOff: 10, courseSlug: "october-half-term-course" },
];

export function findCoursePromoCode(rawCode: string, courseSlug: string): CoursePromoCode | null {
  const normalized = rawCode.trim().toUpperCase();
  if (!normalized) return null;
  return (
    COURSE_PROMO_CODES.find((p) => p.code === normalized && p.courseSlug === courseSlug) ?? null
  );
}

// Questions asked about the child at course-enrollment checkout, answered
// into CourseEnrollment.childAnswers (keyed by id). Mirrors the "Parent/
// Guardian Consent and Student Information Form" used for the October
// Half Term Revision Course. A question with showIfTrack only appears (and is only
// enforced as required) once the parent has selected a day of that track
// — e.g. the Maths exam-board question only matters if they've booked
// Foundation and/or Higher Maths.
export interface CourseChildQuestion {
  id: string;
  label: string;
  type: "text" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
  showIfTrack?: "MATHS" | "SCIENCE";
}

export const COURSE_CHILD_QUESTIONS: CourseChildQuestion[] = [
  { id: "dateOfBirth", label: "Date of birth", type: "text", required: true },
  { id: "yearGroup", label: "Year group", type: "text", required: true },
  { id: "school", label: "Current school", type: "text", required: true },
  {
    id: "parentRelationship",
    label: "Your relationship to the student (e.g. parent, guardian)",
    type: "text",
    required: true,
  },
  { id: "altPhone", label: "Alternative phone number", type: "text", required: false },
  {
    id: "emergencyContactName",
    label: "Emergency contact name (if different from you)",
    type: "text",
    required: false,
  },
  {
    id: "emergencyContactRelationship",
    label: "Emergency contact's relationship to the student",
    type: "text",
    required: false,
  },
  {
    id: "emergencyContactPhone",
    label: "Emergency contact phone number",
    type: "text",
    required: false,
  },
  {
    id: "photoConsent",
    label: "Photography & media consent",
    type: "select",
    required: true,
    options: [
      "Yes — photos/videos may be used for promotional purposes",
      "Yes — for internal records only",
      "No — do not use identifiable photos or videos",
    ],
  },
  {
    id: "medicalConditions",
    label:
      "Any medical conditions, allergies, disabilities or dietary requirements staff should know about",
    type: "textarea",
    required: false,
    placeholder: "Leave blank if none",
  },
  {
    id: "medication",
    label:
      "Any medication the student carries (e.g. inhaler, EpiPen), and whether they can self-administer it or need staff assistance",
    type: "textarea",
    required: false,
    placeholder: "Leave blank if none",
  },
  {
    id: "learningNeeds",
    label:
      "Any diagnosed or suspected learning difficulty/difference, preferred learning style, or Exam Access Arrangements (e.g. extra time) we should know about",
    type: "textarea",
    required: false,
    placeholder: "Leave blank if none",
  },
  {
    id: "mathsExamBoard",
    label: "Maths exam board (e.g. AQA, Edexcel, OCR, WJEC)",
    type: "text",
    required: true,
    showIfTrack: "MATHS",
  },
  {
    id: "mathsSet",
    label: "Maths set (e.g. Set 1, Set 2)",
    type: "text",
    required: false,
    showIfTrack: "MATHS",
  },
  {
    id: "mathsTier",
    label: "Foundation or Higher tier Maths?",
    type: "select",
    required: true,
    options: ["Foundation", "Higher", "Not yet decided"],
    showIfTrack: "MATHS",
  },
  {
    id: "mathsGrade",
    label: "Current working/predicted grade in Maths",
    type: "text",
    required: false,
    showIfTrack: "MATHS",
  },
  {
    id: "mathsFocus",
    label: "Any topics in Maths the student would particularly like to focus on",
    type: "textarea",
    required: false,
    showIfTrack: "MATHS",
  },
  {
    id: "scienceExamBoard",
    label: "Science exam board(s) (e.g. AQA, Edexcel, OCR, WJEC)",
    type: "text",
    required: true,
    showIfTrack: "SCIENCE",
  },
  {
    id: "scienceTier",
    label: "Double or Triple Science?",
    type: "select",
    required: true,
    options: [
      "Double Award (Combined Science)",
      "Triple Award (Biology, Chemistry, Physics)",
    ],
    showIfTrack: "SCIENCE",
  },
  {
    id: "scienceGrade",
    label: "Current working/predicted grade in Science",
    type: "text",
    required: false,
    showIfTrack: "SCIENCE",
  },
  {
    id: "scienceFocus",
    label: "Any topics in Biology, Chemistry or Physics the student would particularly like to focus on",
    type: "textarea",
    required: false,
    showIfTrack: "SCIENCE",
  },
];
