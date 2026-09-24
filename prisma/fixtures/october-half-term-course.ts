import { Prisma, type PrismaClient } from "@prisma/client";

// Shared by prisma/seed.ts (dev/test databases, alongside the fake
// accounts) and scripts/launch-october-half-term-course.ts (a production
// database, with nothing else touched). Safe to run more than once —
// everything is upserted by slug/label, not created blindly.
export async function upsertOctoberHalfTermCourse(prisma: PrismaClient) {
  const course = await prisma.course.upsert({
    where: { slug: "october-half-term-course" },
    update: {},
    create: {
      title: "GCSE October Half Term Revision Course",
      slug: "october-half-term-course",
      description:
        "Small-group GCSE revision over October half term: choose a single day at £99, or all 3 Sciences plus a Maths tier of your choice (4 days) for £300. A 25% deposit secures your child's place; the balance is due 12 October.",
      status: "UPCOMING",
      startDate: new Date("2026-10-26"),
      endDate: new Date("2026-10-30"),
      venue: "Elizabeth College",
      timeLabel: "9:00am – 3:00pm",
      bundlePricePence: 30000,
      bundleLabel: "All 3 Sciences + 1 Maths (4 days)",
      depositPercent: 25,
      balanceDueDate: new Date("2026-10-12"),
    },
  });

  // 5 separate days, Monday to Friday — this is the structure Mia
  // confirmed (the uploaded consent form's 3-combined-day version was an
  // earlier draft and doesn't apply here).
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

  // Clean up any day from an earlier version of this fixture (e.g. the
  // original 5-separate-days draft) that's no longer part of the program —
  // unless a family has already booked onto it, in which case leave it
  // alone rather than crash the script.
  try {
    await prisma.courseDay.deleteMany({
      where: { courseId: course.id, label: { notIn: days.map((d) => d.label) } },
    });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003")) {
      throw err;
    }
  }

  return course;
}
