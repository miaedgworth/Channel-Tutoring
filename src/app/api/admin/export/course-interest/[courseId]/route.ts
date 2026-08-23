import { NextResponse } from "next/server";
import { requireUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { toCsv, csvResponse } from "@/lib/csv";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  await requireUser("ADMIN");
  const { courseId } = await params;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  const interests = await prisma.courseInterest.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
  });

  const rows = interests.map((i) => ({
    name: i.name,
    email: i.email,
    phone: i.phone ?? "",
    message: i.message ?? "",
    submittedAt: i.createdAt.toISOString(),
  }));

  return csvResponse(
    toCsv(rows, ["name", "email", "phone", "message", "submittedAt"]),
    `${course.slug}-interest.csv`,
  );
}
