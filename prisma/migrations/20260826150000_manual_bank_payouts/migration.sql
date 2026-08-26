-- Switch tutor payouts from Stripe Connect / PayPal to manual bank
-- transfer: tutors store their bank details, admin pays them directly
-- and marks payouts as paid.

ALTER TABLE "TutorProfile"
  DROP COLUMN IF EXISTS "stripeConnectAccountId",
  DROP COLUMN IF EXISTS "stripeOnboardingComplete",
  DROP COLUMN IF EXISTS "paypalEmail",
  ADD COLUMN "bankAccountName" TEXT,
  ADD COLUMN "bankSortCode" TEXT,
  ADD COLUMN "bankAccountNumber" TEXT;

ALTER TABLE "Payout"
  DROP COLUMN IF EXISTS "stripeTransferId",
  DROP COLUMN IF EXISTS "paypalPayoutItemId",
  DROP COLUMN IF EXISTS "paypalBatchId";
