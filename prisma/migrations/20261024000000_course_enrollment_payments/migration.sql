-- CreateEnum
CREATE TYPE "CourseDayTrack" AS ENUM ('MATHS', 'SCIENCE', 'OTHER');

-- CreateEnum
CREATE TYPE "CoursePaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "CourseEnrollmentStatus" AS ENUM ('AWAITING_DEPOSIT', 'DEPOSIT_PAID', 'PAID_IN_FULL', 'CANCELLED');

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "venue" TEXT,
ADD COLUMN     "timeLabel" TEXT,
ADD COLUMN     "bundlePricePence" INTEGER,
ADD COLUMN     "bundleLabel" TEXT,
ADD COLUMN     "depositPercent" INTEGER,
ADD COLUMN     "balanceDueDate" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CourseDay" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" TEXT NOT NULL,
    "track" "CourseDayTrack" NOT NULL DEFAULT 'OTHER',
    "pricePence" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CourseDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childAnswers" JSONB NOT NULL,
    "termsSignedAt" TIMESTAMP(3) NOT NULL,
    "termsSignedName" TEXT NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "totalPence" INTEGER NOT NULL,
    "depositPence" INTEGER NOT NULL,
    "balancePence" INTEGER NOT NULL,
    "depositStatus" "CoursePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "depositCheckoutSessionId" TEXT,
    "depositPaidAt" TIMESTAMP(3),
    "balanceStatus" "CoursePaymentStatus" NOT NULL DEFAULT 'PENDING',
    "balanceCheckoutSessionId" TEXT,
    "balancePaidAt" TIMESTAMP(3),
    "balanceReminderSentAt" TIMESTAMP(3),
    "balancePaidManuallyByName" TEXT,
    "status" "CourseEnrollmentStatus" NOT NULL DEFAULT 'AWAITING_DEPOSIT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollmentDay" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,

    CONSTRAINT "CourseEnrollmentDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseDay_courseId_idx" ON "CourseDay"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_depositCheckoutSessionId_key" ON "CourseEnrollment"("depositCheckoutSessionId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_clientId_idx" ON "CourseEnrollment"("clientId");

-- CreateIndex
CREATE INDEX "CourseEnrollmentDay_dayId_idx" ON "CourseEnrollmentDay"("dayId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollmentDay_enrollmentId_dayId_key" ON "CourseEnrollmentDay"("enrollmentId", "dayId");

-- AddForeignKey
ALTER TABLE "CourseDay" ADD CONSTRAINT "CourseDay_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollmentDay" ADD CONSTRAINT "CourseEnrollmentDay_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "CourseEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollmentDay" ADD CONSTRAINT "CourseEnrollmentDay_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "CourseDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
