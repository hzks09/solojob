import type { MetadataRoute } from "next";
import { PROTECTED_ROUTE_PREFIXES } from "@/lib/constants";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Dérivé de la liste partagée : une route protégée ajoutée au middleware
      // devient automatiquement non indexable, sans oubli possible.
      disallow: ["/api/", ...PROTECTED_ROUTE_PREFIXES],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
