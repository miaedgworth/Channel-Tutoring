"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { postSchema, type PostInput } from "@/lib/validations/post";
import { uniquePostSlug } from "@/lib/slug";

export async function createPost(
  input: PostInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const slug = await uniquePostSlug(data.title);

  const post = await prisma.post.create({
    data: {
      type: data.type,
      title: data.title,
      slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImageUrl: data.coverImageUrl || null,
      authorName: data.authorName,
      status: data.status,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
      featuredTutorId: data.featuredTutorId || null,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath("/blog");
  revalidatePath("/news");
  redirect(`/admin/content/${post.id}`);
}

export async function updatePost(
  postId: string,
  input: PostInput,
): Promise<{ error: string } | { error?: undefined }> {
  await requireUser("ADMIN");
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  const existing = await prisma.post.findUnique({ where: { id: postId } });
  if (!existing) return { error: "Post not found." };

  await prisma.post.update({
    where: { id: postId },
    data: {
      type: data.type,
      title: data.title,
      excerpt: data.excerpt,
      content: data.content,
      coverImageUrl: data.coverImageUrl || null,
      authorName: data.authorName,
      status: data.status,
      publishedAt:
        data.status === "PUBLISHED" ? (existing.publishedAt ?? new Date()) : existing.publishedAt,
      featuredTutorId: data.featuredTutorId || null,
    },
  });

  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${postId}`);
  revalidatePath("/blog");
  revalidatePath("/news");
  revalidatePath(`/blog/${existing.slug}`);
  revalidatePath(`/news/${existing.slug}`);

  return {};
}

export async function deletePost(postId: string) {
  await requireUser("ADMIN");
  await prisma.post.delete({ where: { id: postId } });
  revalidatePath("/admin/content");
  revalidatePath("/blog");
  revalidatePath("/news");
}
