"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import {
  courseSchema,
  courseDaySchema,
  courseTopicRequestSchema,
  type CourseInput,
  type CourseDayInput,
  type CourseTopicRequestInput,
} from "@/lib/validations/course";
import {
  manualCourseEnrollmentSchema,
  type ManualCourseEnrollmentInput,
} from "@/lib/validations/course-enrollment";
import { uniqueCourseSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";
import { computeCoursePrice, splitDepositAndBalance } from "@/lib/course-pricing";
import { DEFAULT_COURSE_DEPOSIT_PERCENT, COURSE_TERMS_VERSION } from "@/lib/constants";

export async function createCourse(
  input: CourseInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const slug = await uniqueCourseSlug(data.title);

  let course;
  try {
    course = await prisma.course.create({
      data: {
        title: data.title,
        slug,
        description: data.description,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        venue: data.venue || null,
        timeLabel: data.timeLabel || null,
        bundlePricePence: data.bundlePricePence ? Number(data.bundlePricePence) : null,
        bundleLabel: data.bundleLabel || null,
        depositPercent: data.depositPercent ? Number(data.depositPercent) : null,
        balanceDueDate: data.balanceDueDate ? new Date(data.balanceDueDate) : null,
      },
    });
  } catch (err) {
    // uniqueCourseSlug()'s own check is check-then-act — two admins
    // creating a course with the same title at nearly the same time could
    // both pass it before either commits.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { error: "A course with a very similar title was just created — please try again." };
    }
    throw err;
  }

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(
  courseId: string,
  input: CourseInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) return { error: "Course not found." };

  try {
    await prisma.course.update({
      where: { id: courseId },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        venue: data.venue || null,
        timeLabel: data.timeLabel || null,
        bundlePricePence: data.bundlePricePence ? Number(data.bundlePricePence) : null,
        bundleLabel: data.bundleLabel || null,
        depositPercent: data.depositPercent ? Number(data.depositPercent) : null,
        balanceDueDate: data.balanceDueDate ? new Date(data.balanceDueDate) : null,
      },
    });
  } catch (err) {
    // Another admin could have deleted this course between the findUnique
    // above and this update.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { error: "Course not found." };
    }
    throw err;
  }

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${existing.slug}`);

  return {};
}

// Replaces the whole set of tutors shown on a course's "Meet your tutors"
// section — simpler than diffing since it's a short, admin-picked list, not
// something written to concurrently.
export async function updateCourseTutors(
  courseId: string,
  tutorIds: string[],
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "Course not found." };

  const validTutors = await prisma.tutorProfile.findMany({
    where: { id: { in: tutorIds } },
    select: { id: true },
  });
  if (validTutors.length !== new Set(tutorIds).size) {
    return { error: "One of the selected tutors no longer exists." };
  }

  await prisma.$transaction([
    prisma.courseTutor.deleteMany({ where: { courseId } }),
    prisma.courseTutor.createMany({
      data: tutorIds.map((tutorId, index) => ({ courseId, tutorId, sortOrder: index })),
    }),
  ]);

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${course.slug}`);
  revalidatePath("/courses");
  return {};
}

export async function createCourseDay(
  courseId: string,
  input: CourseDayInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = courseDaySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return { error: "Course not found." };

  await prisma.courseDay.create({
    data: {
      courseId,
      date: new Date(data.date),
      label: data.label,
      track: data.track,
      pricePence: Number(data.pricePence),
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
      capacity: data.capacity ? Number(data.capacity) : null,
    },
  });

  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath(`/courses/${course.slug}`);
  return {};
}

export async function updateCourseDay(
  dayId: string,
  input: CourseDayInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = courseDaySchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const day = await prisma.courseDay.findUnique({ where: { id: dayId }, include: { course: true } });
  if (!day) return { error: "Day not found." };

  await prisma.courseDay.update({
    where: { id: dayId },
    data: {
      date: new Date(data.date),
      label: data.label,
      track: data.track,
      pricePence: Number(data.pricePence),
      sortOrder: data.sortOrder ? Number(data.sortOrder) : 0,
      capacity: data.capacity ? Number(data.capacity) : null,
    },
  });

  revalidatePath(`/admin/courses/${day.courseId}`);
  revalidatePath(`/courses/${day.course.slug}`);
  return {};
}

export async function deleteCourseDay(dayId: string) {
  await requireUser("ADMIN");
  const day = await prisma.courseDay.findUnique({ where: { id: dayId }, include: { course: true } });
  if (!day) return;

  try {
    await prisma.courseDay.delete({ where: { id: dayId } });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) {
      throw err;
    }
  }

  revalidatePath(`/admin/courses/${day.courseId}`);
  revalidatePath(`/courses/${day.course.slug}`);
}

// Internal notes only — never shown on the public site. Tied to a specific
// CourseDay so a "subject" is always one of the course's real days, not a
// free-text field that could drift from what tutors actually see.
export async function createCourseTopicRequest(
  input: CourseTopicRequestInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");

  const parsed = courseTopicRequestSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const day = await prisma.courseDay.findUnique({ where: { id: data.dayId } });
  if (!day) return { error: "Subject not found." };

  await prisma.courseTopicRequest.create({
    data: { dayId: data.dayId, topic: data.topic, requestedBy: data.requestedBy },
  });

  revalidatePath(`/admin/courses/${day.courseId}`);
  return {};
}

export async function deleteCourseTopicRequest(topicRequestId: string) {
  await requireUser("ADMIN");
  const topicRequest = await prisma.courseTopicRequest.findUnique({
    where: { id: topicRequestId },
    include: { day: true },
  });
  if (!topicRequest) return;

  try {
    await prisma.courseTopicRequest.delete({ where: { id: topicRequestId } });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) {
      throw err;
    }
  }

  revalidatePath(`/admin/courses/${topicRequest.day.courseId}`);
}

export async function markCourseBalancePaidManually(
  enrollmentId: string,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const enrollment = await prisma.courseEnrollment.findUnique({ where: { id: enrollmentId } });
  if (!enrollment) return { error: "Enrolment not found." };
  if (enrollment.balanceStatus === "PAID") return {};

  await prisma.courseEnrollment.update({
    where: { id: enrollmentId },
    data: {
      balanceStatus: "PAID",
      balancePaidAt: new Date(),
      balancePaidManuallyByName: admin.name,
      status: "PAID_IN_FULL",
    },
  });

  await logAudit({
    actorId: admin.id,
    action: "COURSE_BALANCE_MARKED_PAID_MANUALLY",
    targetType: "CourseEnrollment",
    targetId: enrollmentId,
    metadata: { amountPence: enrollment.balancePence },
  });

  revalidatePath(`/admin/courses/${enrollment.courseId}`);
  return {};
}

// For a booking made outside the site (phone, in person, bank transfer) —
// no Stripe checkout, no client account. Price is still computed from the
// course's real day/bundle pricing, same as the public wizard, so it can
// never drift from what everyone else pays for the same days.
export async function createManualCourseEnrollment(
  courseId: string,
  input: ManualCourseEnrollmentInput,
): Promise<{ error: string } | { error?: undefined }> {
  const admin = await requireUser("ADMIN");

  const parsed = manualCourseEnrollmentSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const course = await prisma.course.findUnique({ where: { id: courseId }, include: { days: true } });
  if (!course) return { error: "Course not found." };

  const courseDayIds = new Set(course.days.map((d) => d.id));
  if (!data.dayIds.every((id) => courseDayIds.has(id))) {
    return { error: "One of the selected days doesn't belong to this course." };
  }

  const { totalPence } = computeCoursePrice(course, data.dayIds);
  if (totalPence <= 0) {
    return { error: "Select at least one day." };
  }
  const depositPercent = course.depositPercent ?? DEFAULT_COURSE_DEPOSIT_PERCENT;
  const { depositPence, balancePence } = splitDepositAndBalance(totalPence, depositPercent);

  const now = new Date();
  const enrollment = await prisma.courseEnrollment.create({
    data: {
      courseId: course.id,
      clientId: null,
      guestName: data.guardianName,
      guestEmail: data.guardianEmail || null,
      guestPhone: data.guardianPhone || null,
      childName: data.childName,
      childAnswers: data.notes ? { notes: data.notes } : {},
      termsSignedAt: now,
      termsSignedName: data.guardianName,
      termsVersion: COURSE_TERMS_VERSION,
      totalPence,
      depositPence,
      balancePence,
      depositStatus: data.depositStatus,
      depositPaidAt: data.depositStatus === "PAID" ? now : null,
      balanceStatus: data.balanceStatus,
      balancePaidAt: data.balanceStatus === "PAID" ? now : null,
      balancePaidManuallyByName: data.balanceStatus === "PAID" ? admin.name : null,
      status:
        data.balanceStatus === "PAID"
          ? "PAID_IN_FULL"
          : data.depositStatus === "PAID"
            ? "DEPOSIT_PAID"
            : "AWAITING_DEPOSIT",
      days: { create: data.dayIds.map((dayId) => ({ dayId })) },
    },
  });

  await logAudit({
    actorId: admin.id,
    action: "COURSE_ENROLLMENT_ADDED_MANUALLY",
    targetType: "CourseEnrollment",
    targetId: enrollment.id,
    metadata: {
      courseId: course.id,
      totalPence,
      depositPence,
      depositStatus: data.depositStatus,
      balanceStatus: data.balanceStatus,
    },
  });

  revalidatePath(`/admin/courses/${course.id}`);
  return {};
}

export async function deleteCourse(courseId: string) {
  await requireUser("ADMIN");
  try {
    await prisma.course.delete({ where: { id: courseId } });
  } catch (err) {
    // Already deleted (e.g. a double-click, or another admin got there
    // first) — nothing left to do.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) {
      throw err;
    }
  }
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}
