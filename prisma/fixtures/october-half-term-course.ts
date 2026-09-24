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
      title: "October Half Term GCSE Revision Intensive",
      slug: "october-half-term-course",
      description: [
        "Give your child a real head start before the mock season. Our small-group GCSE revision days over October half term are built to do two things: lift grades and rebuild confidence. Rather than passively re-reading notes, students spend the day working through exam-style questions, uncovering the gaps in their knowledge and learning exactly how examiners award marks. They leave knowing what to revise, how to revise it, and how to tackle the paper on the day.",
        "Sessions are led by a subject specialist who can support your child at every step, whether they're aiming to secure a pass or push for the top grades. Groups are kept deliberately small, so each student gets individual attention and the chance to ask the questions they might not ask in a full classroom. Sticking points are spotted early, explained clearly, and practised until they click.",
        "Choose what suits your child:\n- Single day – £99. Pick the subject where your child needs the biggest boost.\n- Full Science & Maths package (4 days) – £300. Biology, Chemistry and Physics, plus a Maths day at the tier of your choice (Foundation or Higher). That's four days of focused, expert-led revision for the price of three, giving your child real momentum going into the winter term.",
        "Places are strictly limited to keep groups small, and spots fill quickly at half term. A 25% deposit secures your child's place; the balance is due by 12 October.",
        "Book now and let your child walk into their mocks feeling prepared, capable and calm.",
      ].join("\n\n"),
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
  // earlier draft and doesn't apply here). Each day is capped at 10
  // students.
  const days: { label: string; date: string; track: "MATHS" | "SCIENCE"; sortOrder: number }[] = [
    { label: "Foundation Maths", date: "2026-10-26", track: "MATHS", sortOrder: 1 },
    { label: "Higher Maths", date: "2026-10-27", track: "MATHS", sortOrder: 2 },
    { label: "Biology", date: "2026-10-28", track: "SCIENCE", sortOrder: 3 },
    { label: "Chemistry", date: "2026-10-29", track: "SCIENCE", sortOrder: 4 },
    { label: "Physics", date: "2026-10-30", track: "SCIENCE", sortOrder: 5 },
  ];
  const DAY_CAPACITY = 10;

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
      capacity: DAY_CAPACITY,
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
