-- CreateEnum
CREATE TYPE "TokenTransactionType" AS ENUM ('PURCHASE', 'REDEEM', 'REFUND');

-- DropForeignKey
ALTER TABLE "CreditTransaction" DROP CONSTRAINT "CreditTransaction_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "creditBalancePence";

-- DropTable
DROP TABLE "CreditTransaction";

-- DropEnum
DROP TYPE "CreditTransactionType";

-- CreateTable
CREATE TABLE "TokenBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" "Level" NOT NULL,
    "type" "TokenTransactionType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "bookingId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TokenBalance_userId_idx" ON "TokenBalance"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TokenBalance_userId_level_key" ON "TokenBalance"("userId", "level");

-- CreateIndex
CREATE INDEX "TokenTransaction_userId_createdAt_idx" ON "TokenTransaction"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TokenBalance" ADD CONSTRAINT "TokenBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenTransaction" ADD CONSTRAINT "TokenTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Data cleanup: bookings left over from the previous "tutor schedules,
-- client confirms with credit" flow have no way to be confirmed under the
-- token model (there's no confirm step any more). Cancel any still sitting
-- in that pre-payment state; no money ever moved for these, so there's
-- nothing to reverse.
UPDATE "Booking"
SET status = 'CANCELLED_BY_TUTOR',
    "cancelledAt" = now(),
    "cancellationReason" = 'Automatically cancelled: superseded by the lesson token system.'
WHERE status = 'PENDING_PAYMENT';
