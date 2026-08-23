"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { courseSchema, type CourseInput } from "@/lib/validations/course";
import { uniqueCourseSlug } from "@/lib/slug";

export async function createCourse(input: CourseInput) {
  await requireUser("ADMIN");
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const data = parsed.data;
  const slug = await uniqueCourseSlug(data.title);

  const course = await prisma.course.create({
    data: {
      title: data.title,
      slug,
      description: data.description,
      status: data.status,
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
    },
  });

  revalidatePath("/admin/courses");
  revalidatePath("/courses");
  redirect(`/admin/courses/${course.id}`);
}

export async function updateCourse(courseId: string, input: CourseInput) {
  await requireUser("ADMIN");
  const parsed = courseSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const data = parsed.data;

  const existing = await prisma.course.findUnique({ where: { id: courseId } });
  if (!existing) throw new Error("Course not found.");

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

  revalidatePath("/admin/courses");
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath("/courses");
  revalidatePath(`/courses/${existing.slug}`);
}

export async function deleteCourse(courseId: string) {
  await requireUser("ADMIN");
  await prisma.course.delete({ where: { id: courseId } });
  revalidatePath("/admin/courses");
  revalidatePath("/courses");
}
