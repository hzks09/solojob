import Stripe from "stripe";

/**
 * Client Stripe serveur uniquement — jamais importé dans un composant client.
 * Gratuit à l'intégration ; Stripe prélève une commission uniquement sur les
 * paiements réellement effectués.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  typescript: true,
});

/** Price IDs des abonnements NextWatch (Gratuit / NextWatch+) — voir étape Stripe abonnements. */
export const STRIPE_PRICE_IDS = {
  solo: process.env.STRIPE_PRICE_ID_SOLO ?? "",
  solo_plus: process.env.STRIPE_PRICE_ID_SOLO_PLUS ?? "",
} as const;
