-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN "paypalEmail" TEXT;

-- AlterTable
ALTER TABLE "Payout" ADD COLUMN "paypalPayoutItemId" TEXT;
ALTER TABLE "Payout" ADD COLUMN "paypalBatchId" TEXT;
