import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("AdminPass123!", 12);
  await prisma.user.upsert({
    where: { email: "admin@channeltutoring.gg" },
    update: {},
    create: {
      email: "admin@channeltutoring.gg",
      name: "Channel Tutoring Admin",
      passwordHash: adminPassword,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const tutorPassword = await bcrypt.hash("TutorPass123!", 12);
  const tutorUser = await prisma.user.upsert({
    where: { email: "tutor@channeltutoring.gg" },
    update: {},
    create: {
      email: "tutor@channeltutoring.gg",
      name: "Sophie Le Page",
      passwordHash: tutorPassword,
      role: "TUTOR",
      status: "ACTIVE",
    },
  });

  await prisma.tutorProfile.upsert({
    where: { userId: tutorUser.id },
    update: {},
    create: {
      userId: tutorUser.id,
      slug: "sophie-le-page",
      headline: "Experienced GCSE & A-Level Maths and Physics Tutor",
      bio: "I'm a Guernsey-based tutor with over eight years' experience helping students build confidence in Maths and Physics. I specialise in exam technique for AQA and Edexcel, and I love turning 'I don't get it' into 'I've got this.'",
      photoUrl: null,
      subjects: ["Maths", "Physics"],
      levels: ["GCSE", "A_LEVEL"],
      qualifications: "MSc Physics (Bristol), PGCE, QTS",
      sessionMode: "BOTH",
      isPublished: true,
    },
  });

  const clientPassword = await bcrypt.hash("ClientPass123!", 12);
  await prisma.user.upsert({
    where: { email: "client@channeltutoring.gg" },
    update: {},
    create: {
      email: "client@channeltutoring.gg",
      name: "Jamie Parent",
      passwordHash: clientPassword,
      role: "CLIENT",
      status: "ACTIVE",
      newsletterOptIn: true,
    },
  });

  await prisma.course.upsert({
    where: { slug: "summer-school-2026" },
    update: {},
    create: {
      title: "Summer School 2026",
      slug: "summer-school-2026",
      description:
        "Our summer school has just taken place. More details and highlights coming soon.",
      status: "PAST",
      startDate: new Date("2026-08-04"),
      endDate: new Date("2026-08-14"),
    },
  });

  await prisma.course.upsert({
    where: { slug: "october-half-term-course" },
    update: {},
    create: {
      title: "October Half Term Course",
      slug: "october-half-term-course",
      description:
        "Full details are coming soon. Express your interest below and we'll be in touch as soon as booking opens.",
      status: "UPCOMING",
      startDate: null,
      endDate: null,
    },
  });

  console.log("Seed complete.");
  console.log("Admin login:  admin@channeltutoring.gg / AdminPass123!");
  console.log("Tutor login:  tutor@channeltutoring.gg / TutorPass123!");
  console.log("Client login: client@channeltutoring.gg / ClientPass123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
