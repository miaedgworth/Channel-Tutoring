import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Content" };
export const dynamic = "force-dynamic";

export default async function AdminContentPage() {
  const posts = await prisma.post.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <LinkButton href="/admin/content/new" variant="gold" size="sm">
          New Post
        </LinkButton>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-navy/60">No content yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post.id} href={`/admin/content/${post.id}`}>
              <Card className="transition-colors hover:border-navy/30">
                <CardContent className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-navy">{post.title}</p>
                      <Badge variant="neutral">{post.type.replaceAll("_", " ")}</Badge>
                      <Badge variant={post.status === "PUBLISHED" ? "success" : "warning"}>
                        {post.status}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-navy/50">{post.excerpt}</p>
                  </div>
                  <p className="shrink-0 text-xs text-navy/40">
                    {formatDate(post.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
