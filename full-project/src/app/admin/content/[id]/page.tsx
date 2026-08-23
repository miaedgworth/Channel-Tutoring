import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "@/components/admin/post-form";

export const metadata: Metadata = { title: "Edit Post" };
export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: PageProps<"/admin/content/[id]">) {
  const { id } = await params;
  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <Card className="max-w-3xl">
      <CardContent>
        <PostForm post={post} />
      </CardContent>
    </Card>
  );
}
