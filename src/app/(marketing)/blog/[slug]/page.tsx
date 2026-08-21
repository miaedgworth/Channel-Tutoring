import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { PostBody } from "@/components/content/post-body";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug } });
  if (!post) return {};
  return { title: post.title, description: post.excerpt };
}

export default async function BlogPostPage({
  params,
}: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const post = await prisma.post.findUnique({ where: { slug, status: "PUBLISHED" } });
  if (!post || post.type !== "BLOG") notFound();

  return (
    <div className="py-16">
      <Container className="max-w-2xl">
        <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-sm text-navy/50">
          {post.authorName}
          {post.publishedAt && <> &middot; {formatDate(post.publishedAt)}</>}
        </p>

        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            className="mt-6 w-full rounded-xl object-cover"
          />
        )}

        <div className="mt-8">
          <PostBody content={post.content} />
        </div>
      </Container>
    </div>
  );
}
