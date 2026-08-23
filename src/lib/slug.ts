import { prisma } from "@/lib/prisma";

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function uniqueTutorSlug(name: string) {
  const base = slugify(name) || "tutor";
  let slug = base;
  let suffix = 1;
  while (await prisma.tutorProfile.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function uniquePostSlug(title: string) {
  const base = slugify(title) || "post";
  let slug = base;
  let suffix = 1;
  while (await prisma.post.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}

export async function uniqueCourseSlug(title: string) {
  const base = slugify(title) || "course";
  let slug = base;
  let suffix = 1;
  while (await prisma.course.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${base}-${suffix}`;
  }
  return slug;
}
