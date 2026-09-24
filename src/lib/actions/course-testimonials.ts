"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import {
  courseTestimonialSchema,
  type CourseTestimonialInput,
} from "@/lib/validations/course-testimonial";

export async function createCourseTestimonial(
  input: CourseTestimonialInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = courseTestimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  await prisma.courseTestimonial.create({
    data: {
      studentName: data.studentName,
      quote: data.quote,
      rating: data.rating ? Number(data.rating) : null,
      courseId: data.courseId || null,
    },
  });

  revalidatePath("/admin/testimonials");
  revalidatePath("/courses");
  return {};
}

export async function updateCourseTestimonial(
  testimonialId: string,
  input: CourseTestimonialInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = courseTestimonialSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    await prisma.courseTestimonial.update({
      where: { id: testimonialId },
      data: {
        studentName: data.studentName,
        quote: data.quote,
        rating: data.rating ? Number(data.rating) : null,
        courseId: data.courseId || null,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { error: "Testimonial not found." };
    }
    throw err;
  }

  revalidatePath("/admin/testimonials");
  revalidatePath("/courses");
  return {};
}

export async function deleteCourseTestimonial(testimonialId: string) {
  await requireUser("ADMIN");
  try {
    await prisma.courseTestimonial.delete({ where: { id: testimonialId } });
  } catch (err) {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025")) {
      throw err;
    }
  }
  revalidatePath("/admin/testimonials");
  revalidatePath("/courses");
}
