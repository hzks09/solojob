import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { stripe, STRIPE_PRICE_IDS } from "@/lib/stripe/client";

const bodySchema = z.object({ plan: z.enum(["solo", "solo_plus"]) });

export async function POST(req: Request) {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const priceId = STRIPE_PRICE_IDS[parsed.data.plan];
  if (!priceId) {
    return NextResponse.json({ error: "Ce forfait n'est pas encore configuré" }, { status: 500 });
  }

  let customerId = current.profile?.stripeCustomerId ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: current.authUser.email,
      name: current.profile?.fullName ?? undefined,
      metadata: { userId: current.authUser.id },
    });
    customerId = customer.id;
    await db.update(profiles).set({ stripeCustomerId: customerId }).where(eq(profiles.id, current.authUser.id));
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?checkout=success`,
    cancel_url: `${appUrl}/billing?checkout=canceled`,
    metadata: { userId: current.authUser.id, plan: parsed.data.plan },
    subscription_data: { metadata: { userId: current.authUser.id, plan: parsed.data.plan } },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
