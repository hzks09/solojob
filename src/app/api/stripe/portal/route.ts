import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { stripe } from "@/lib/stripe/client";

export async function POST() {
  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  if (!current.profile?.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement Stripe associé" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: current.profile.stripeCustomerId,
    return_url: `${appUrl}/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
