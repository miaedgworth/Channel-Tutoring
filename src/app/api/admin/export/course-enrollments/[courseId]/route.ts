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

  const enrollments = await prisma.courseEnrollment.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    include: {
      client: { select: { name: true, email: true, phone: true } },
      days: { include: { day: true }, orderBy: { day: { sortOrder: "asc" } } },
    },
  });

  const rows = enrollments.map((e) => ({
    childName: e.childName,
    parentName: e.client?.name ?? e.guestName ?? "",
    parentEmail: e.client?.email ?? e.guestEmail ?? "",
    parentPhone: e.client?.phone ?? e.guestPhone ?? "",
    days: e.days.map((d) => d.day.label).join("; "),
    totalPence: String(e.totalPence),
    depositStatus: e.depositStatus,
    balanceStatus: e.balanceStatus,
    childAnswers: JSON.stringify(e.childAnswers),
    submittedAt: e.createdAt.toISOString(),
  }));

  return csvResponse(
    toCsv(rows, [
      "childName",
      "parentName",
      "parentEmail",
      "parentPhone",
      "days",
      "totalPence",
      "depositStatus",
      "balanceStatus",
      "childAnswers",
      "submittedAt",
    ]),
    `${course.slug}-enrollments.csv`,
  );
}
