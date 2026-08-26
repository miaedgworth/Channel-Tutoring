-- Ask applicants for their GCSE and A-Level grades.

ALTER TABLE "TutorApplication"
  ADD COLUMN "gcseGrades" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "aLevelGrades" TEXT NOT NULL DEFAULT '';

ALTER TABLE "TutorApplication" ALTER COLUMN "gcseGrades" DROP DEFAULT;
ALTER TABLE "TutorApplication" ALTER COLUMN "aLevelGrades" DROP DEFAULT;
