import type { MetadataRoute } from "next";
import { region } from "@/lib/region";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `https://${region.domain}`;
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
