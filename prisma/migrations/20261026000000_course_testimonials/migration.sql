-- CreateTable
CREATE TABLE "CourseTestimonial" (
    "id" TEXT NOT NULL,
    "courseId" TEXT,
    "studentName" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "rating" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseTestimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseTestimonial_courseId_idx" ON "CourseTestimonial"("courseId");

-- AddForeignKey
ALTER TABLE "CourseTestimonial" ADD CONSTRAINT "CourseTestimonial_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
