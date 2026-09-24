import type { PrismaClient } from "@prisma/client";

// Shared by prisma/seed.ts (dev/test databases, alongside the fake
// accounts) and scripts/launch-october-half-term-course.ts (a production
// database, with nothing else touched). Safe to run more than once —
// everything is upserted by slug/label, not created blindly.
export async function upsertOctoberHalfTermCourse(prisma: PrismaClient) {
  const course = await prisma.course.upsert({
    where: { slug: "october-half-term-course" },
    update: {},
    create: {
      title: "October Half Term Course",
      slug: "october-half-term-course",
      description:
        "A week of small-group GCSE exam prep over October half term: choose a single day at £99, or take all 3 Sciences plus a Maths tier of your choice for £300. A 25% deposit secures your child's place; the balance is due 12 October.",
      status: "UPCOMING",
      startDate: new Date("2026-10-26"),
      endDate: new Date("2026-10-30"),
      venue: "EC",
      timeLabel: "9am – 3pm each day",
      bundlePricePence: 30000,
      bundleLabel: "All 3 Sciences + 1 Maths (4 days)",
      depositPercent: 25,
      balanceDueDate: new Date("2026-10-12"),
    },
  });

  const days: { label: string; date: string; track: "MATHS" | "SCIENCE"; sortOrder: number }[] = [
    { label: "Foundation Maths", date: "2026-10-26", track: "MATHS", sortOrder: 1 },
    { label: "Higher Maths", date: "2026-10-27", track: "MATHS", sortOrder: 2 },
    { label: "Biology", date: "2026-10-28", track: "SCIENCE", sortOrder: 3 },
    { label: "Chemistry", date: "2026-10-29", track: "SCIENCE", sortOrder: 4 },
    { label: "Physics", date: "2026-10-30", track: "SCIENCE", sortOrder: 5 },
  ];

  for (const day of days) {
    const existing = await prisma.courseDay.findFirst({
      where: { courseId: course.id, label: day.label },
    });
    const data = {
      courseId: course.id,
      date: new Date(day.date),
      label: day.label,
      track: day.track,
      pricePence: 9900,
      sortOrder: day.sortOrder,
    };
    if (existing) {
      await prisma.courseDay.update({ where: { id: existing.id }, data });
    } else {
      await prisma.courseDay.create({ data });
    }
  }

  return course;
}
