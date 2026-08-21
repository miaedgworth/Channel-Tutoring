import Link from "next/link";
import { formatDate } from "@/lib/utils";

export function PostCard({
  basePath,
  post,
}: {
  basePath: string;
  post: {
    slug: string;
    title: string;
    excerpt: string;
    authorName: string;
    publishedAt: Date | null;
    coverImageUrl: string | null;
  };
}) {
  return (
    <Link
      href={`${basePath}/${post.slug}`}
      className="group block overflow-hidden rounded-xl border border-navy/10 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt=""
          className="h-40 w-full object-cover"
        />
      )}
      <div className="p-5">
        <h3 className="font-heading text-lg font-semibold text-navy group-hover:underline">
          {post.title}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm text-navy/60">{post.excerpt}</p>
        <p className="mt-3 text-xs text-navy/40">
          {post.authorName}
          {post.publishedAt && <> &middot; {formatDate(post.publishedAt)}</>}
        </p>
      </div>
    </Link>
  );
}
