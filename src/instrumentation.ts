import * as Sentry from "@sentry/nextjs";

/**
 * Suivi d'erreurs en production — capture automatiquement les exceptions non
 * gérées des Route Handlers (webhook Stripe, cron des relances) et des
 * Server Actions via le hook `onRequestError` de Next.js. Inactif tant que
 * SENTRY_DSN n'est pas défini (voir sentry.server.config.ts).
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
