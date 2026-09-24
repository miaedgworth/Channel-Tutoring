-- Allow a CourseEnrollment to belong to a guest (no account) instead of a
-- registered User. clientId becomes nullable; guestName/guestEmail/
-- guestPhone are set instead when there's no client. No access token is
-- used for guest bookings — a guest confirms their identity by typing the
-- email they booked with on the pay-balance page.

ALTER TABLE "CourseEnrollment" ALTER COLUMN "clientId" DROP NOT NULL;

ALTER TABLE "CourseEnrollment" ADD COLUMN "guestName" TEXT;
ALTER TABLE "CourseEnrollment" ADD COLUMN "guestEmail" TEXT;
ALTER TABLE "CourseEnrollment" ADD COLUMN "guestPhone" TEXT;
