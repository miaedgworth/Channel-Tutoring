-- Lets a client prove control of their email (a 6-digit code) before their
-- self-registered account can sign in — see EMAIL_NOT_VERIFIED in auth.ts.
CREATE TABLE "EmailVerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailVerificationCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailVerificationCode_userId_idx" ON "EmailVerificationCode"("userId");

ALTER TABLE "EmailVerificationCode" ADD CONSTRAINT "EmailVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Grandfather every existing account (self-registered clients, and
-- admin/tutor-invited accounts alike) so this new login gate only affects
-- signups going forward, never anyone already active.
UPDATE "User" SET "emailVerifiedAt" = COALESCE("emailVerifiedAt", "createdAt") WHERE "emailVerifiedAt" IS NULL;
