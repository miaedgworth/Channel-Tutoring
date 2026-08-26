-- Let admins manually grant lesson tokens to a client (for sessions
-- paid for off-platform), distinct from card purchases in the ledger.

ALTER TYPE "TokenTransactionType" ADD VALUE 'ADMIN_GRANT';
