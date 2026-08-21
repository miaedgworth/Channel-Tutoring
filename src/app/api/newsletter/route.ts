import { NextResponse } from "next/server";
import { z } from "zod";
import { subscribeEmail } from "@/lib/newsletter";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email() });

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`newsletter:${ip}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await subscribeEmail(parsed.data.email, "footer-form");

  return NextResponse.json({ ok: true });
}
