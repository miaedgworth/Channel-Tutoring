"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { courseSchema, courseDaySchema, type CourseInput, type CourseDayInput } from "@/lib/validations/course";
import { uniqueCourseSlug } from "@/lib/slug";
import { logAudit } from "@/lib/audit";

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
