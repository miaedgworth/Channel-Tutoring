-- Internal-only log of topics students/parents want covered, tied to a
-- specific CourseDay so it's inherently subject-specific. Never shown on
-- the public site.

CREATE TABLE "CourseTopicRequest" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "requestedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CourseTopicRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CourseTopicRequest_dayId_idx" ON "CourseTopicRequest"("dayId");

ALTER TABLE "CourseTopicRequest" ADD CONSTRAINT "CourseTopicRequest_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "CourseDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
