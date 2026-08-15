import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const PUBLIC_PATHS = ["/", "/cgu", "/mentions-legales", "/confidentialite", "/login", "/signup"];

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_PATHS.map((path) => ({
    url: `${appUrl}${path}`,
    lastModified: new Date(),
  }));
}
