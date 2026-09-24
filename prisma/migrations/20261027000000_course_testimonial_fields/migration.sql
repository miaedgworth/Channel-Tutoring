-- AlterTable
ALTER TABLE "CourseTestimonial" ADD COLUMN     "role" TEXT,
ADD COLUMN     "subject" TEXT,
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT true;
