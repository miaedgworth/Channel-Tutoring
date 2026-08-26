-- Backfill firstClientMessageNotifiedAt for every conversation that
-- already has at least one message, so the "new client" email doesn't
-- fire on the next message in an existing conversation (the column
-- defaults to NULL for pre-existing rows, which the app otherwise reads
-- as "never notified yet").
UPDATE "Conversation" c
SET "firstClientMessageNotifiedAt" = sub.first_message_at
FROM (
  SELECT "conversationId", MIN("createdAt") AS first_message_at
  FROM "Message"
  GROUP BY "conversationId"
) sub
WHERE c.id = sub."conversationId"
  AND c."firstClientMessageNotifiedAt" IS NULL;
