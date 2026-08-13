"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { stripe } from "@/lib/stripe/client";

/**
 * Crée (ou réutilise) le compte Stripe Connect Express de l'artisan et
 * renvoie l'URL d'onboarding Stripe vers laquelle le rediriger. C'est ce
 * compte qui reçoit l'argent des factures payées — jamais le compte
 * plateforme.
 */
export async function startStripeConnectOnboardingAction(): Promise<{ url: string }> {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  let accountId = current.profile?.stripeConnectAccountId ?? null;

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: "express",
      country: "FR",
      email: current.authUser.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: { userId: current.authUser.id },
    });
    accountId = account.id;
    await db
      .update(profiles)
      .set({ stripeConnectAccountId: accountId, updatedAt: new Date() })
      .where(eq(profiles.id, current.authUser.id));
  }

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${appUrl}/settings?stripe_connect=refresh`,
    return_url: `${appUrl}/settings?stripe_connect=return`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

/**
 * Vérifie l'état réel du compte Connect auprès de Stripe et met à jour
 * `stripeConnectChargesEnabled`. Appelé quand l'artisan revient de
 * l'onboarding Stripe (l'état n'est fiable qu'en le revérifiant côté Stripe).
 */
export async function syncStripeConnectStatusAction(): Promise<{ chargesEnabled: boolean }> {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");

  const accountId = current.profile?.stripeConnectAccountId;
  if (!accountId) return { chargesEnabled: false };

  const account = await stripe.accounts.retrieve(accountId);
  const chargesEnabled = account.charges_enabled;

  if (chargesEnabled !== current.profile?.stripeConnectChargesEnabled) {
    await db
      .update(profiles)
      .set({ stripeConnectChargesEnabled: chargesEnabled, updatedAt: new Date() })
      .where(eq(profiles.id, current.authUser.id));
  }

  return { chargesEnabled };
}
