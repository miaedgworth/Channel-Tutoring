import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Container } from "@/components/ui/container";
import { PostCard } from "@/components/content/post-card";

export const metadata: Metadata = {
  title: "News",
  description: "The latest news and tutor spotlights from Channel Tutoring.",
};
export const dynamic = "force-dynamic";

export default async function NewsIndexPage() {
  const posts = await prisma.post.findMany({
    where: { type: { in: ["NEWS", "TUTOR_SPOTLIGHT"] }, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="py-16">
      <Container>
        <div className="text-center">
          <h1 className="font-heading text-3xl font-bold text-navy sm:text-4xl">News</h1>
          <p className="mx-auto mt-3 max-w-xl text-navy/70">
            Updates and tutor spotlights from Channel Tutoring.
          </p>
        </div>

        {posts.length === 0 ? (
          <p className="mt-12 text-center text-navy/50">No news yet — check back soon.</p>
        ) : (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} basePath="/news" post={post} />
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
