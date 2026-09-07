-- AlterTable
ALTER TABLE "Booking" ADD COLUMN "seriesId" TEXT;
ALTER TABLE "Booking" ADD COLUMN "tokensReserved" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Booking" ADD COLUMN "paymentReminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Booking_seriesId_idx" ON "Booking"("seriesId");
