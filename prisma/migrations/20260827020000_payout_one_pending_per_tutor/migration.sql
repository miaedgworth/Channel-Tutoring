-- Enforce at most one PENDING payout per tutor at the database level.
-- requestBankPayout()'s "already has a pending payout" check is a
-- check-then-act that isn't safe under concurrent requests (a double
-- click, or a retried request) — this partial unique index is what
-- actually makes it impossible for two PENDING payouts to exist for the
-- same tutor at once. Not representable as a plain Prisma @@unique
-- (those can't be filtered to a WHERE clause), so it isn't reflected in
-- schema.prisma beyond a comment on the Payout model.
CREATE UNIQUE INDEX "Payout_tutorId_one_pending" ON "Payout" ("tutorId") WHERE status = 'PENDING';
