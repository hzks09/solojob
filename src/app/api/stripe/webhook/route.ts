import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { profiles, stripeWebhookEvents } from "@/lib/db/schema";
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
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Signature invalide: ${err instanceof Error ? err.message : "?"}` }, { status: 400 });
  }

  // Idempotence : Stripe peut renvoyer le même event (retry réseau). L'id est
  // stable, donc un conflit de clé primaire ici veut dire "déjà traité".
  try {
    await db.insert(stripeWebhookEvents).values({ id: event.id });
  } catch (err) {
    if ((err as { code?: string } | null)?.code === "23505") {
      return NextResponse.json({ received: true });
    }
    throw err;
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;

      // Souscription à un forfait payant.
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
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
