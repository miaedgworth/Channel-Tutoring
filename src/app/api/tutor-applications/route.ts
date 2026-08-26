import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tutorApplicationSchema } from "@/lib/validations/tutor-application";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { sendEmail, baseEmailLayout } from "@/lib/email";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`tutor-application:${ip}`, {
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = tutorApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const application = await prisma.tutorApplication.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      subjects: data.subjects,
      levels: data.levels,
      qualifications: data.qualifications,
      gcseGrades: data.gcseGrades,
      aLevelGrades: data.aLevelGrades,
      cvUrl: data.cvUrl || null,
      referenceUrl: data.referenceUrl || null,
      bio: data.bio,
      availabilityNotes: data.availabilityNotes || null,
    },
  });

  await sendEmail({
    to: data.email,
    subject: "We've received your Channel Tutoring application",
    html: baseEmailLayout(`
      <p>Hi ${data.name},</p>
      <p>Thanks for applying to tutor with Channel Tutoring. Our team will review
      your application and get back to you as soon as possible.</p>
      <p>If you have a CV or references to share, please reply to this email
      and attach them.</p>
    `),
  }).catch(() => {});

  return NextResponse.json({ id: application.id });
}
