// One-off launch script for the October Half Term course. Creates (or, if
// re-run, updates in place) the Course row and its 5 CourseDay rows —
// nothing else in the database is touched. Safe to run more than once.
//
// Run against the real production database with:
//   DATABASE_URL="<production connection string>" npx tsx scripts/launch-october-half-term-course.ts
import { PrismaClient } from "@prisma/client";
import { upsertOctoberHalfTermCourse } from "../prisma/fixtures/october-half-term-course";

const prisma = new PrismaClient();

async function main() {
  const course = await upsertOctoberHalfTermCourse(prisma);
  console.log(`October Half Term course ready: /courses/${course.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
