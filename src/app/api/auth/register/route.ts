import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import { subscribeEmail } from "@/lib/newsletter";

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const { success } = rateLimit(`register:${ip}`, {
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });
  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    );
  }

  const { name, email, password, newsletterOptIn, agreedToTerms } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  let user;
  try {
    user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "CLIENT",
        newsletterOptIn,
        agreedToTermsAt: agreedToTerms ? new Date() : null,
      },
    });
  } catch (err) {
    // The findUnique check above is a check-then-act — it can't see a
    // second signup for the same email that's already in flight — so the
    // unique constraint on email is the actual guarantee here.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 },
      );
    }
    throw err;
  }

  if (newsletterOptIn) {
    await subscribeEmail(email, "signup").catch(() => {
      // Newsletter provider issues shouldn't block account creation.
    });
  }

  return NextResponse.json({ id: user.id, email: user.email });
}
