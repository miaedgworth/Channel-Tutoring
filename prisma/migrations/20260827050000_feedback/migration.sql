-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "tutorName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "helpfulText" TEXT NOT NULL,
    "improveText" TEXT,
    "consentToShare" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Feedback_createdAt_idx" ON "Feedback"("createdAt");
