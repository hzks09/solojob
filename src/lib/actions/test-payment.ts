"use server";

import { getCurrentUser } from "@/lib/auth/current-user";
import { stripe } from "@/lib/stripe/client";

/**
 * TEMPORAIRE — vérifie juste que l'intégration Stripe live fonctionne.
 * Paiement direct sur le compte plateforme (pas de Stripe Connect, puisqu'il
 * n'est pas encore actif) : ne reflète pas le vrai circuit "argent chez
 * l'artisan". À supprimer une fois le test fait — voir StripeTestPaymentCard.
 */
export async function createTestPaymentAction(): Promise<{ url: string } | { error: string }> {
  const current = await getCurrentUser();
  if (!current) return { error: "Non authentifié" };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: "Test paiement SoloJob (0,50€)" },
          unit_amount: 50,
        },
        quantity: 1,
      },
    ],
    after_completion: { type: "redirect", redirect: { url: `${appUrl}/settings` } },
  });

  return { url: paymentLink.url };
}
