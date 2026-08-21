import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.channeltutoring.gg";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/tutor-dashboard", "/admin", "/api"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
