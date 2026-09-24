"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { logAudit } from "@/lib/audit";
import { region } from "@/lib/region";
import { formatCurrency, formatDate } from "@/lib/utils";
import { computeCoursePrice, splitDepositAndBalance } from "@/lib/course-pricing";
import {
  courseEnrollmentSchema,
  findMissingRequiredAnswer,
  type CourseEnrollmentInput,
} from "@/lib/validations/course-enrollment";
import { DEFAULT_COURSE_DEPOSIT_PERCENT, COURSE_TERMS_VERSION } from "@/lib/constants";

export async function createCourseEnrollment(
  courseSlug: string,
  input: CourseEnrollmentInput,
): Promise<{ error: string } | { url: string }> {
  const user = await requireUser("CLIENT");

  const parsed = courseEnrollmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

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

  const missing = findMissingRequiredAnswer(data.childAnswers);
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
      clientId: user.id,
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
    actorId: user.id,
    action: "COURSE_ENROLLMENT_STARTED",
    targetType: "CourseEnrollment",
    targetId: enrollment.id,
    metadata: { courseId: course.id, totalPence, depositPence },
  });

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
    success_url: `${appUrl}/dashboard/courses?checkout=success`,
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
