import Stripe from "stripe";

/**
 * Client Stripe serveur uniquement — jamais importé dans un composant client.
 * Gratuit à l'intégration ; Stripe prélève une commission uniquement sur les
 * paiements réellement effectués par les clients.
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  typescript: true,
});

export const STRIPE_PRICE_IDS = {
  pro: process.env.STRIPE_PRICE_ID_PRO ?? "",
  premium: process.env.STRIPE_PRICE_ID_PREMIUM ?? "",
} as const;
