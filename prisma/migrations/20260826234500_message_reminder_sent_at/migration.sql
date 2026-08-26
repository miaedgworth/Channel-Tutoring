-- AlterTable
ALTER TABLE "Message" ADD COLUMN "reminderSentAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Message_readAt_reminderSentAt_createdAt_idx" ON "Message"("readAt", "reminderSentAt", "createdAt");
