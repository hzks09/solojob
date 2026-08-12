import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { payments, subscriptions, users } from "@/lib/db/schema";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe/client";
import type { PlanTier } from "@/lib/db/schema";

const PRICE_TO_PLAN: Record<string, PlanTier> = {
  [STRIPE_PRICE_IDS.pro]: "pro",
  [STRIPE_PRICE_IDS.premium]: "premium",
};

async function upsertSubscriptionFromStripe(sub: Stripe.Subscription, userId: string) {
  const priceId = sub.items.data[0]?.price.id;
  const plan = (priceId && PRICE_TO_PLAN[priceId]) || "free";
  const item = sub.items.data[0];

  await db
    .insert(subscriptions)
    .values({
      userId,
      stripeSubscriptionId: sub.id,
      stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
      plan,
      status: sub.status as (typeof subscriptions.$inferInsert)["status"],
      currentPeriodStart: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
      currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
    })
    .onConflictDoUpdate({
      target: subscriptions.userId,
      set: {
        stripeSubscriptionId: sub.id,
        plan,
        status: sub.status as (typeof subscriptions.$inferInsert)["status"],
        currentPeriodStart: item?.current_period_start ? new Date(item.current_period_start * 1000) : null,
        currentPeriodEnd: item?.current_period_end ? new Date(item.current_period_end * 1000) : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        updatedAt: new Date(),
      },
    });

  const activePlan = sub.status === "active" || sub.status === "trialing" ? plan : "free";
  await db.update(users).set({ plan: activePlan }).where(eq(users.id, userId));
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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (userId && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          typeof session.subscription === "string" ? session.subscription : session.subscription.id
        );
        await upsertSubscriptionFromStripe(sub, userId);
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.created": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) await upsertSubscriptionFromStripe(sub, userId);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      if (userId) {
        await db.update(users).set({ plan: "free" }).where(eq(users.id, userId));
        await db
          .update(subscriptions)
          .set({ status: "canceled", plan: "free", updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId));
      }
      break;
    }
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (customerId) {
        const [dbUser] = await db.select().from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
        if (dbUser) {
          await db.insert(payments).values({
            userId: dbUser.id,
            stripeInvoiceId: invoice.id,
            amount: String((invoice.amount_paid ?? 0) / 100),
            currency: invoice.currency,
            status: "succeeded",
            description: invoice.lines.data[0]?.description ?? "Abonnement RoomAI",
          });
        }
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
