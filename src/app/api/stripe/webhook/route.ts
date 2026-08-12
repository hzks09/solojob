import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { factures } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe/client";

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
    // Paiement d'une facture via Payment Link (mode "payment", pas abonnement).
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const factureId = session.metadata?.factureId;
      if (session.mode === "payment" && factureId) {
        await db
          .update(factures)
          .set({ statut: "payee", datePaiement: new Date(), updatedAt: new Date() })
          .where(eq(factures.id, factureId));
      }
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
