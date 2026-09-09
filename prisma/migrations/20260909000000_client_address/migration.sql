-- AlterTable
ALTER TABLE "User" ADD COLUMN "addressLine1" TEXT;
ALTER TABLE "User" ADD COLUMN "addressLine2" TEXT;
ALTER TABLE "User" ADD COLUMN "addressTown" TEXT;
ALTER TABLE "User" ADD COLUMN "addressPostcode" TEXT;
ALTER TABLE "User" ADD COLUMN "addressRequestedAt" TIMESTAMP(3);
