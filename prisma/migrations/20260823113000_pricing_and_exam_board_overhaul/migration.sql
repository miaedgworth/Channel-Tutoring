-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Level" ADD VALUE 'KS3';
ALTER TYPE "Level" ADD VALUE 'UNIVERSITY_ADMISSIONS';

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "discountPence" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TutorApplication" DROP COLUMN "examBoards";

-- AlterTable
ALTER TABLE "TutorProfile" DROP COLUMN "examBoards",
DROP COLUMN "hourlyRatePence";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "agreedToTermsAt" TIMESTAMP(3);

