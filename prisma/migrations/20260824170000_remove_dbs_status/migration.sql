-- Removes DBS check tracking from the database. DBS is no longer verified
-- or displayed by the platform anywhere except the Tutor Agreement, which
-- now states tutors are responsible for obtaining their own DBS check
-- where appropriate. Nothing else is affected.

ALTER TABLE "TutorApplication" DROP COLUMN IF EXISTS "dbsStatus";
ALTER TABLE "TutorProfile" DROP COLUMN IF EXISTS "dbsStatus";
DROP TYPE IF EXISTS "DbsStatus";
