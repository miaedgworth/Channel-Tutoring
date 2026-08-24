import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATIC_ROUTES = [
  "",
  "/find-a-tutor",
  "/how-it-works",
  "/about",
  "/news",
  "/blog",
  "/join-as-a-tutor",
  "/pricing",
  "/contact",
  "/faq",
  "/legal/privacy-policy",
  "/legal/terms",
  "/legal/cookie-policy",
  "/legal/safeguarding-policy",
  "/legal/cancellation-refund-policy",
  "/legal/acceptable-use-policy",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.channeltutoring.com";

  const [tutors, posts] = await Promise.all([
    prisma.tutorProfile.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.post.findMany({
      where: { status: "PUBLISHED" },
      select: { slug: true, type: true, updatedAt: true },
    }),
  ]);

  return [
    ...STATIC_ROUTES.map((route) => ({
      url: `${appUrl}${route}`,
      lastModified: new Date(),
    })),
    ...tutors.map((t) => ({
      url: `${appUrl}/tutors/${t.slug}`,
      lastModified: t.updatedAt,
    })),
    ...posts.map((p) => ({
      url: `${appUrl}/${p.type === "BLOG" ? "blog" : "news"}/${p.slug}`,
      lastModified: p.updatedAt,
    })),
  ];
}
