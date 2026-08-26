-- Guarantee a redelivered Stripe webhook event can never credit tokens
-- for the same checkout session twice. Postgres treats every NULL as
-- distinct in a unique index, so non-Stripe transactions (which leave
-- this column null) are unaffected.
CREATE UNIQUE INDEX "TokenTransaction_stripeCheckoutSessionId_key" ON "TokenTransaction"("stripeCheckoutSessionId");
