"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { auth } from "@/lib/auth";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { region } from "@/lib/region";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeCoursePrice, splitDepositAndBalance } from "@/lib/course-pricing";
import { getDaysAvailability } from "@/lib/course-capacity";
import {
  courseEnrollmentSchema,
  guestBalancePaymentSchema,
  findMissingRequiredAnswer,
  type CourseEnrollmentInput,
} from "@/lib/validations/course-enrollment";
import { DEFAULT_COURSE_DEPOSIT_PERCENT, COURSE_TERMS_VERSION } from "@/lib/constants";

export async function createCourseEnrollment(
  courseSlug: string,
  input: CourseEnrollmentInput,
): Promise<{ error: string } | { url: string }> {
  const session = await auth();
  const isLoggedInClient =
    session?.user?.role === "CLIENT" &&
    session.user.status !== "SUSPENDED" &&
    !session.user.sessionRevoked;
  const clientId = isLoggedInClient ? session!.user.id : null;

  const parsed = courseEnrollmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  let contactEmail: string;
  let guestName: string | null = null;
  let guestEmail: string | null = null;
  let guestPhone: string | null = null;
  if (clientId) {
    contactEmail = session!.user.email;
  } else {
    if (!data.guestName || !data.guestEmail) {
      return { error: "Enter your name and email to continue." };
    }
    guestName = data.guestName;
    guestEmail = data.guestEmail;
    guestPhone = data.guestPhone ?? null;
    contactEmail = data.guestEmail;
  }

  const course = await prisma.course.findUnique({
    where: { slug: courseSlug },
    include: { days: true },
  });
  if (!course || course.status !== "UPCOMING" || course.days.length === 0) {
    return { error: "This course isn't open for booking." };
  }

  const courseDayIds = new Set(course.days.map((d) => d.id));
  if (!data.dayIds.every((id) => courseDayIds.has(id))) {
    return { error: "One of the selected days is no longer available." };
  }

  const availability = await getDaysAvailability(
    course.days.map((d) => ({ id: d.id, capacity: d.capacity })),
  );
  const soldOutDay = course.days.find(
    (d) => data.dayIds.includes(d.id) && availability.get(d.id)?.soldOut,
  );
  if (soldOutDay) {
    return { error: `${soldOutDay.label} is sold out.` };
  }

  const selectedTracks = new Set(
    course.days.filter((d) => data.dayIds.includes(d.id)).map((d) => d.track),
  );
  const missing = findMissingRequiredAnswer(data.childAnswers, selectedTracks);
  if (missing) {
    return { error: `Please answer: ${missing}` };
  }

  if (!isStripeConfigured()) {
    return { error: "Payments are not configured in this environment yet." };
  }

  const { totalPence } = computeCoursePrice(course, data.dayIds);
  if (totalPence <= 0) {
    return { error: "Select at least one day." };
  }
  const depositPercent = course.depositPercent ?? DEFAULT_COURSE_DEPOSIT_PERCENT;
  const { depositPence, balancePence } = splitDepositAndBalance(totalPence, depositPercent);

  const selectedDays = course.days
    .filter((d) => data.dayIds.includes(d.id))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const enrollment = await prisma.courseEnrollment.create({
    data: {
      courseId: course.id,
      clientId,
      guestName,
      guestEmail,
      guestPhone,
      childName: data.childName,
      childAnswers: data.childAnswers,
      termsSignedAt: new Date(),
      termsSignedName: data.termsSignedName,
      termsVersion: COURSE_TERMS_VERSION,
      totalPence,
      depositPence,
      balancePence,
      days: { create: data.dayIds.map((dayId) => ({ dayId })) },
    },
  });

  await logAudit({
    actorId: clientId,
    action: "COURSE_ENROLLMENT_STARTED",
    targetType: "CourseEnrollment",
    targetId: enrollment.id,
    metadata: { courseId: course.id, totalPence, depositPence, guest: clientId === null },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: contactEmail,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: region.currency.toLowerCase(),
          unit_amount: depositPence,
          product_data: {
            name: `Deposit: ${course.title}`,
            description: `${selectedDays.map((d) => d.label).join(", ")} — balance of ${formatCurrency(balancePence)} due ${course.balanceDueDate ? formatDate(course.balanceDueDate) : "later"}`,
          },
        },
      },
    ],
    metadata: {
      type: "course_deposit",
      enrollmentId: enrollment.id,
    },
    success_url: clientId
      ? `${appUrl}/dashboard/courses?checkout=success`
      : `${appUrl}/courses/pay-balance/${enrollment.id}?checkout=deposit-success`,
    cancel_url: `${appUrl}/courses/${course.slug}?checkout=cancelled`,
  });

  return { url: checkoutSession.url! };
}

export async function requestCourseBalancePayment(
  enrollmentId: string,
): Promise<{ error: string } | { url: string }> {
  const user = await requireUser("CLIENT");

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (!enrollment || enrollment.clientId !== user.id) {
    return { error: "Enrolment not found." };
  }
  if (enrollment.depositStatus !== "PAID") {
    return { error: "The deposit for this booking hasn't been paid yet." };
  }
  if (enrollment.balanceStatus === "PAID") {
    return { error: "The balance for this booking has already been paid." };
  }
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured in this environment yet." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: region.currency.toLowerCase(),
          unit_amount: enrollment.balancePence,
          product_data: {
            name: `Balance: ${enrollment.course.title}`,
            description: `${enrollment.childName} — remaining balance for this course booking`,
          },
        },
      },
    ],
    metadata: {
      type: "course_balance",
      enrollmentId: enrollment.id,
    },
    success_url: `${appUrl}/dashboard/courses?checkout=success`,
    cancel_url: `${appUrl}/dashboard/courses?checkout=cancelled`,
  });

  await prisma.courseEnrollment.update({
    where: { id: enrollment.id },
    data: { balanceCheckoutSessionId: checkoutSession.id },
  });

  revalidatePath("/dashboard/courses");
  return { url: checkoutSession.url! };
}

// Guest bookings have no account and no access token — a guest proves it's
// their booking by typing the email they gave at signup, checked against
// CourseEnrollment.guestEmail. Errors are deliberately generic so this
// can't be used to probe for a booking's existence or its email.
export async function requestGuestCourseBalancePayment(
  enrollmentId: string,
  email: string,
): Promise<{ error: string } | { url: string }> {
  const parsedEmail = guestBalancePaymentSchema.safeParse({ email });
  if (!parsedEmail.success) {
    return { error: "Enter a valid email address." };
  }

  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    include: { course: true },
  });
  if (
    !enrollment ||
    enrollment.clientId !== null ||
    !enrollment.guestEmail ||
    enrollment.guestEmail.toLowerCase() !== parsedEmail.data.email
  ) {
    return { error: "We couldn't find a booking with that email." };
  }
  if (enrollment.depositStatus !== "PAID") {
    return { error: "The deposit for this booking hasn't been paid yet." };
  }
  if (enrollment.balanceStatus === "PAID") {
    return { error: "The balance for this booking has already been paid." };
  }
  if (!isStripeConfigured()) {
    return { error: "Payments are not configured in this environment yet." };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: parsedEmail.data.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: region.currency.toLowerCase(),
          unit_amount: enrollment.balancePence,
          product_data: {
            name: `Balance: ${enrollment.course.title}`,
            description: `${enrollment.childName} — remaining balance for this course booking`,
          },
        },
      },
    ],
    metadata: {
      type: "course_balance",
      enrollmentId: enrollment.id,
    },
    success_url: `${appUrl}/courses/pay-balance/${enrollment.id}?checkout=success`,
    cancel_url: `${appUrl}/courses/pay-balance/${enrollment.id}?checkout=cancelled`,
  });

  await prisma.courseEnrollment.update({
    where: { id: enrollment.id },
    data: { balanceCheckoutSessionId: checkoutSession.id },
  });

  return { url: checkoutSession.url! };
}
