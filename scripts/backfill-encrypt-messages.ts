// One-off backfill: encrypts any Message.body still stored as plaintext
// (rows written before field-level encryption shipped). Safe to re-run —
// rows already encrypted (body starts with the "enc:v1:" prefix) are
// skipped. Requires DATA_ENCRYPTION_KEY to be set to the same key the app
// uses, or existing messages become unreadable after this runs.
//
// Run against the real production database with:
//   DATABASE_URL="<production connection string>" DATA_ENCRYPTION_KEY="<key>" npx tsx scripts/backfill-encrypt-messages.ts
import { PrismaClient } from "@prisma/client";
import { encryptText, isEncrypted } from "../src/lib/encryption";

const prisma = new PrismaClient();

async function main() {
  const messages = await prisma.message.findMany({
    select: { id: true, body: true },
  });
  const plaintext = messages.filter((m) => !isEncrypted(m.body));

  console.log(`${messages.length} messages total, ${plaintext.length} still plaintext.`);

  let updated = 0;
  for (const message of plaintext) {
    await prisma.message.update({
      where: { id: message.id },
      data: { body: encryptText(message.body) },
    });
    updated += 1;
  }

  console.log(`Encrypted ${updated} message(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
