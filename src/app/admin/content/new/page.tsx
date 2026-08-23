import type { Metadata } from "next";
import { Card, CardContent } from "@/components/ui/card";
import { PostForm } from "@/components/admin/post-form";

export const metadata: Metadata = { title: "New Post" };

export default function NewPostPage() {
  return (
    <Card className="max-w-3xl">
      <CardContent>
        <PostForm />
      </CardContent>
    </Card>
  );
}
