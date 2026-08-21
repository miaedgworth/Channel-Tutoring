"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createPost, updatePost, deletePost } from "@/lib/actions/posts";

const inputClass =
  "mt-1.5 block w-full rounded-md border border-navy/20 px-3 py-2.5 text-sm focus:border-gold-dark focus:outline-none focus:ring-1 focus:ring-gold-dark";

type PostType = "BLOG" | "NEWS" | "TUTOR_SPOTLIGHT";
type PostStatus = "DRAFT" | "PUBLISHED";

export function PostForm({
  post,
}: {
  post?: {
    id: string;
    type: PostType;
    title: string;
    excerpt: string;
    content: string;
    coverImageUrl: string | null;
    authorName: string;
    status: PostStatus;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [type, setType] = useState<PostType>(post?.type ?? "BLOG");
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [content, setContent] = useState(post?.content ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [authorName, setAuthorName] = useState(post?.authorName ?? "Channel Tutoring Team");
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "DRAFT");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const input = { type, title, excerpt, content, coverImageUrl, authorName, status, featuredTutorId: "" };
        if (post) {
          await updatePost(post.id, input);
          router.refresh();
        } else {
          await createPost(input);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function handleDelete() {
    if (!post) return;
    if (!confirm("Delete this post? This can't be undone.")) return;
    startTransition(async () => {
      await deletePost(post.id);
      router.push("/admin/content");
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {error && (
        <p role="alert" className="rounded-md bg-red/10 px-4 py-3 text-sm text-red">
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-navy">
            Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as PostType)}
            className={inputClass}
          >
            <option value="BLOG">Blog</option>
            <option value="NEWS">News</option>
            <option value="TUTOR_SPOTLIGHT">Tutor Spotlight</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-navy">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as PostStatus)}
            className={inputClass}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-navy">
          Title
        </label>
        <input
          id="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-medium text-navy">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          required
          rows={2}
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-navy">
          Content
        </label>
        <textarea
          id="content"
          required
          rows={12}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className={inputClass}
          placeholder="Separate paragraphs with a blank line."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="coverImageUrl" className="block text-sm font-medium text-navy">
            Cover image URL (optional)
          </label>
          <input
            id="coverImageUrl"
            type="url"
            value={coverImageUrl}
            onChange={(e) => setCoverImageUrl(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="authorName" className="block text-sm font-medium text-navy">
            Author name
          </label>
          <input
            id="authorName"
            required
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Saving..." : post ? "Save Changes" : "Create Post"}
        </Button>
        {post && (
          <Button type="button" variant="danger" disabled={isPending} onClick={handleDelete}>
            Delete
          </Button>
        )}
      </div>
    </form>
  );
}
