import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { feedbackSchema } from "@/lib/validations/feedback";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`feedback:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!success) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { clientName, tutorName, rating, helpfulText, improveText, consentToShare } = parsed.data;

  await prisma.feedback.create({
    data: {
      clientName,
      tutorName,
      rating,
      helpfulText,
      improveText: improveText || null,
      consentToShare,
    },
  });

  return NextResponse.json({ ok: true });
}
