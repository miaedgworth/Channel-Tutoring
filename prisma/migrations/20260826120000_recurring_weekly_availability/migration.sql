-- Switch TutorAvailabilitySlot from specific calendar dates to a
-- recurring weekly pattern (day of week + period). Existing date-specific
-- rows are cleared since the meaning of the data is changing entirely.

-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

DELETE FROM "TutorAvailabilitySlot";

DROP INDEX IF EXISTS "TutorAvailabilitySlot_tutorId_date_idx";
DROP INDEX IF EXISTS "TutorAvailabilitySlot_tutorId_date_period_key";

ALTER TABLE "TutorAvailabilitySlot"
  DROP COLUMN "date",
  ADD COLUMN "dayOfWeek" "DayOfWeek" NOT NULL;

CREATE INDEX "TutorAvailabilitySlot_tutorId_idx" ON "TutorAvailabilitySlot"("tutorId");
CREATE UNIQUE INDEX "TutorAvailabilitySlot_tutorId_dayOfWeek_period_key" ON "TutorAvailabilitySlot"("tutorId", "dayOfWeek", "period");
