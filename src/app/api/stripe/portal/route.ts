import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { stripe } from "@/lib/stripe/client";
import { rateLimit } from "@/lib/rate-limit";
import { isTrustedOrigin } from "@/lib/verify-origin";

export async function POST(req: Request) {
  // Défense en profondeur CSRF — ce Route Handler est authentifié par cookie
  // et n'a pas la vérification d'origine intégrée des Server Actions Next.
  if (!isTrustedOrigin(req)) {
    return NextResponse.json({ error: "Origine non autorisée" }, { status: 403 });
  }

  const current = await getCurrentUser();
  if (!current) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!(await rateLimit(`stripe-portal:${current.authUser.id}`, 10, 60_000)).success) {
    return NextResponse.json({ error: "Trop de tentatives, réessaie dans une minute." }, { status: 429 });
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
