import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { factures, profiles } from "@/lib/db/schema";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe/client";
import type { PlanTier } from "@/lib/db/schema";

const PRICE_TO_PLAN: Record<string, PlanTier> = {
  [STRIPE_PRICE_IDS.solo]: "solo",
  [STRIPE_PRICE_IDS.solo_plus]: "solo_plus",
};

async function syncPlanFromSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.userId;
  if (!userId) return;

  const priceId = sub.items.data[0]?.price.id;
  const isActive = sub.status === "active" || sub.status === "trialing";
  const plan: PlanTier = isActive && priceId && PRICE_TO_PLAN[priceId] ? PRICE_TO_PLAN[priceId] : "free";

  await db.update(profiles).set({ plan, updatedAt: new Date() }).where(eq(profiles.id, userId));
}

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  // Deux endpoints Stripe pointent ici : un pour les events du compte
  // plateforme (abonnements), un pour les events des comptes Connect des
  // artisans (paiements de factures) — chacun a son propre secret de signature.
  const secrets = [process.env.STRIPE_WEBHOOK_SECRET, process.env.STRIPE_CONNECT_WEBHOOK_SECRET].filter(
    (s): s is string => Boolean(s)
  );

  if (!signature || secrets.length === 0) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event | undefined;
  for (const secret of secrets) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
      break;
    } catch {
      continue;
    }
  }
  if (!event) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Paiement d'une facture via Payment Link (mode "payment", pas abonnement).
      const factureId = session.metadata?.factureId;
      if (session.mode === "payment" && factureId) {
        await db
          .update(factures)
          .set({ statut: "payee", datePaiement: new Date(), updatedAt: new Date() })
          .where(eq(factures.id, factureId));
      }

      // Souscription à un forfait Solo/Solo+.
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id
        );
        await syncPlanFromSubscription(sub);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      await syncPlanFromSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await db.update(profiles).set({ plan: "free", updatedAt: new Date() }).where(eq(profiles.id, userId));
      }
      break;
    }
    case "account.updated": {
      // Event d'un compte Stripe Connect artisan (pas le compte plateforme) :
      // on garde `stripeConnectChargesEnabled` synchronisé sans attendre que
      // l'artisan revienne sur /settings.
      const account = event.data.object as Stripe.Account;
      await db
        .update(profiles)
        .set({ stripeConnectChargesEnabled: account.charges_enabled, updatedAt: new Date() })
        .where(eq(profiles.stripeConnectAccountId, account.id));
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
