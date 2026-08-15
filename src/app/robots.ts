import type { MetadataRoute } from "next";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/clients",
        "/devis",
        "/factures",
        "/settings",
        "/billing",
        // Liens publics de devis (financiers, accessibles uniquement via
        // l'UUID) — jamais destinés à être indexés.
        "/d/",
      ],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
