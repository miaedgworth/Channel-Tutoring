import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { PostCard } from "@/components/content/post-card";

export const metadata: Metadata = {
  title: "Blog",
  description: "Study tips, exam advice and news from Channel Tutoring.",
};
export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const posts = await prisma.post.findMany({
    where: { type: "BLOG", status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="py-16">
      <Container>
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">Blog</h1>
          <p className="mx-auto mt-3 max-w-xl text-navy/70">
            Study tips, exam advice and updates from the Channel Tutoring team.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="mt-12 text-center text-navy/50">No posts yet — check back soon.</p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} basePath="/blog" post={post} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
