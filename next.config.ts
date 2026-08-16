import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

/**
 * CSP statique (pas de nonce) : la majorité des pages de Loupick sont
 * générées statiquement (/, /login, /signup, /mentions-legales, /cgu,
 * /confidentialite...) — un nonce par requête exige un rendu dynamique sur
 * *toutes* les pages (voir doc Next.js sur la CSP), ce qui aurait forcé à
 * désactiver l'optimisation statique et le cache CDN partout pour un projet
 * qui tient justement à rester sur le plan gratuit Vercel. `script-src`
 * garde donc `'unsafe-inline'` — la CSP reste utile pour bloquer les
 * ressources externes non autorisées (img/connect/frame-ancestors...), mais
 * ne protège plus contre l'exécution d'un script inline injecté par une
 * faille XSS ailleurs dans le code.
 *
 * `img-src` autorise explicitement les CDN de vignettes YouTube (`i.ytimg.com`,
 * `*.ggpht.com`) car les vignettes sont affichées via de simples balises
 * `<img>` (video-swiper.tsx, saved-video-card.tsx, suggestion-review-card.tsx),
 * pas `next/image` — `images.remotePatterns` ci-dessous ne les couvre donc
 * pas et n'a aucun effet sur ces balises.
 * `connect-src` inclut l'URL Supabase (auth + requêtes) et Vercel Analytics ;
 * pas d'entrée Sentry car le SDK n'est chargé que côté serveur (aucun
 * sentry.client.config.*) — à revoir si un jour un SDK Sentry côté navigateur
 * est ajouté.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "img-src 'self' https://i.ytimg.com https://*.ggpht.com data:",
  `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""} https://vitals.vercel-insights.com`,
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "replicate.delivery" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Sans SENTRY_ORG/SENTRY_PROJECT/SENTRY_AUTH_TOKEN (aucun compte Sentry créé
// pour l'instant), l'upload des sourcemaps est simplement ignoré au build —
// n'empêche jamais `next build` de réussir.
export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  webpack: { treeshake: { removeDebugLogging: true } },
});
