-- Migrates the database for the new tutor-scheduled booking flow, credit
-- wallet, session mode (online/in person), and removal of the tutor
-- "years of experience" field.
--
-- IMPORTANT: this DELETES existing rows in "TutorAvailabilitySlot" — the
-- old exact-time availability format (e.g. "Tue 2pm-3pm") has no equivalent
-- in the new day + morning/afternoon/evening format, so it can't be
-- converted. Tutors will need to re-add their availability afterward from
-- their dashboard. Nothing else is deleted; existing bookings, profiles,
-- messages, payments etc. are all preserved.

-- New enum types
CREATE TYPE "AvailabilityPeriod" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');
CREATE TYPE "SessionMode" AS ENUM ('ONLINE', 'IN_PERSON', 'BOTH');
CREATE TYPE "CreditTransactionType" AS ENUM ('TOPUP', 'SPEND', 'REFUND');

-- Booking: drop the old slot link and per-booking Stripe checkout fields
-- (replaced by the credit wallet), add sessionMode
ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_slotId_fkey";
DROP INDEX IF EXISTS "Booking_slotId_key";
DROP INDEX IF EXISTS "Booking_stripeCheckoutSessionId_key";
DROP INDEX IF EXISTS "Booking_stripePaymentIntentId_key";

ALTER TABLE "Booking"
  DROP COLUMN IF EXISTS "slotId",
  DROP COLUMN IF EXISTS "stripeCheckoutSessionId",
  DROP COLUMN IF EXISTS "stripePaymentIntentId",
  ADD COLUMN "sessionMode" "SessionMode" NOT NULL DEFAULT 'ONLINE';

-- Only new bookings are required to set this explicitly going forward;
-- existing ones (if any) have been backfilled to 'ONLINE' above.
ALTER TABLE "Booking" ALTER COLUMN "sessionMode" DROP DEFAULT;

-- TutorApplication: remove years of experience
ALTER TABLE "TutorApplication" DROP COLUMN IF EXISTS "yearsExperience";

-- TutorAvailabilitySlot: switch from exact start/end times to day + period.
-- See the warning at the top of this file.
DELETE FROM "TutorAvailabilitySlot";

DROP INDEX IF EXISTS "TutorAvailabilitySlot_tutorId_startsAt_idx";
ALTER TABLE "TutorAvailabilitySlot"
  DROP COLUMN IF EXISTS "endsAt",
  DROP COLUMN IF EXISTS "isBooked",
  DROP COLUMN IF EXISTS "startsAt",
  ADD COLUMN "date" DATE NOT NULL,
  ADD COLUMN "period" "AvailabilityPeriod" NOT NULL;

CREATE INDEX "TutorAvailabilitySlot_tutorId_date_idx" ON "TutorAvailabilitySlot"("tutorId", "date");
CREATE UNIQUE INDEX "TutorAvailabilitySlot_tutorId_date_period_key" ON "TutorAvailabilitySlot"("tutorId", "date", "period");

-- TutorProfile: remove years of experience, add session mode (defaults to
-- offering both, so existing published tutors don't disappear from filters)
ALTER TABLE "TutorProfile"
  DROP COLUMN IF EXISTS "yearsExperience",
  ADD COLUMN "sessionMode" "SessionMode" NOT NULL DEFAULT 'BOTH';

-- User: add the credit wallet balance
ALTER TABLE "User" ADD COLUMN "creditBalancePence" INTEGER NOT NULL DEFAULT 0;

-- New table: credit top-up / spend / refund ledger
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "CreditTransactionType" NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "bookingId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CreditTransaction_userId_createdAt_idx" ON "CreditTransaction"("userId", "createdAt");

ALTER TABLE "CreditTransaction"
  ADD CONSTRAINT "CreditTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
