import * as Sentry from "@sentry/nextjs";

// Sans SENTRY_DSN (variable absente), le SDK Sentry reste inactif de lui-même
// — aucune requête sortante, aucune erreur : même logique de dégradation
// silencieuse que src/lib/email/resend.ts.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
});
