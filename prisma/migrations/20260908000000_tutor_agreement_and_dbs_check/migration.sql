-- AlterTable
ALTER TABLE "TutorProfile" ADD COLUMN "agreementRequestedAt" TIMESTAMP(3);
ALTER TABLE "TutorProfile" ADD COLUMN "agreementSignedAt" TIMESTAMP(3);
ALTER TABLE "TutorProfile" ADD COLUMN "agreementSignedName" TEXT;
ALTER TABLE "TutorProfile" ADD COLUMN "agreementVersion" TEXT;
ALTER TABLE "TutorProfile" ADD COLUMN "dbsCheckUrl" TEXT;
ALTER TABLE "TutorProfile" ADD COLUMN "dbsCheckFileName" TEXT;
ALTER TABLE "TutorProfile" ADD COLUMN "dbsCheckUploadedAt" TIMESTAMP(3);
