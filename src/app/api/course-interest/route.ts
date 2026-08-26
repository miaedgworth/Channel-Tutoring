import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { courseInterestSchema } from "@/lib/validations/course";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, baseEmailLayout } from "@/lib/email";
import { escapeHtml } from "@/lib/utils";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`course-interest:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const courseId = typeof body?.courseId === "string" ? body.courseId : null;
  if (!courseId) {
    return NextResponse.json({ error: "Missing course." }, { status: 400 });
  }

  const parsed = courseInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  const { name, email, phone, message } = parsed.data;

  await prisma.courseInterest.create({
    data: {
      courseId: course.id,
      name,
      email,
      phone: phone || null,
      message: message || null,
    },
  });

  await sendEmail({
    to: email,
    subject: `We've received your interest in ${course.title}`,
    html: baseEmailLayout(`
      <p>Hi ${escapeHtml(name)},</p>
      <p>Thanks for your interest in <strong>${escapeHtml(course.title)}</strong>. We'll
      be in touch as soon as booking details are confirmed.</p>
    `),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
