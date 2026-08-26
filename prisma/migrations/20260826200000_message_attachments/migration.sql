-- Let clients and tutors attach a file to a chat message.

ALTER TABLE "Message"
  ADD COLUMN "attachmentUrl" TEXT,
  ADD COLUMN "attachmentName" TEXT,
  ADD COLUMN "attachmentType" TEXT,
  ADD COLUMN "attachmentSizeBytes" INTEGER;
