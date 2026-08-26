"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { courseSchema, type CourseInput } from "@/lib/validations/course";
import { uniqueCourseSlug } from "@/lib/slug";

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
