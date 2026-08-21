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
  { value: "GCSE", label: "GCSE" },
  { value: "A_LEVEL", label: "A-Level" },
] as const;

export const DBS_STATUS_LABELS: Record<string, string> = {
  NOT_PROVIDED: "Not provided",
  PENDING: "Pending check",
  VERIFIED: "Verified",
};

export const PLATFORM_FEE_PENCE = Number(process.env.PLATFORM_FEE_PENCE ?? 1500);
