-- Allow fractional lesson tokens (e.g. 1.5 tokens for a 1.5-hour
-- session) instead of always whole numbers, and record how many
-- tokens a booking actually consumed so refunds are exact.

ALTER TABLE "TokenBalance"
  ALTER COLUMN "balance" TYPE DECIMAL(6,2) USING "balance"::decimal(6,2);

ALTER TABLE "TokenTransaction"
  ALTER COLUMN "quantity" TYPE DECIMAL(6,2) USING "quantity"::decimal(6,2);

ALTER TABLE "Booking"
  ADD COLUMN "tokensUsed" DECIMAL(6,2) NOT NULL DEFAULT 1;
