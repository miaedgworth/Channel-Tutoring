-- Which tutor(s) are running a course, for a "Meet your tutors" section on
-- the course page — one shared list per course, not per day.

CREATE TABLE "CourseTutor" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "tutorId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseTutor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CourseTutor_courseId_tutorId_key" ON "CourseTutor"("courseId", "tutorId");

CREATE INDEX "CourseTutor_tutorId_idx" ON "CourseTutor"("tutorId");

ALTER TABLE "CourseTutor" ADD CONSTRAINT "CourseTutor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CourseTutor" ADD CONSTRAINT "CourseTutor_tutorId_fkey" FOREIGN KEY ("tutorId") REFERENCES "TutorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
