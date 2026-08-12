"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { factures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { stripe } from "@/lib/stripe/client";

async function requireOwnedFacture(factureId: string) {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");

  const [facture] = await db
    .select()
    .from(factures)
    .where(and(eq(factures.id, factureId), eq(factures.userId, current.authUser.id)))
    .limit(1);
  if (!facture) throw new Error("Facture introuvable");

  return facture;
}

/** Crée (ou réutilise) un lien de paiement Stripe pour cette facture, et passe son statut à "envoyée". */
export async function createPaymentLinkAction(factureId: string): Promise<{ url: string }> {
  const facture = await requireOwnedFacture(factureId);

  if (facture.stripePaymentLinkUrl) {
    if (facture.statut === "brouillon") {
      await db.update(factures).set({ statut: "envoyee", updatedAt: new Date() }).where(eq(factures.id, factureId));
      revalidatePath(`/factures/${factureId}`);
    }
    return { url: facture.stripePaymentLinkUrl };
  }

  const amountCents = Math.round(Number(facture.montantTotal) * 100);
  if (amountCents <= 0) throw new Error("Le montant de la facture doit être supérieur à 0");

  const paymentLink = await stripe.paymentLinks.create({
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: `Facture ${facture.numero}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    metadata: { factureId: facture.id },
    after_completion: { type: "hosted_confirmation" },
  });

  await db
    .update(factures)
    .set({
      stripePaymentLinkId: paymentLink.id,
      stripePaymentLinkUrl: paymentLink.url,
      statut: facture.statut === "brouillon" ? "envoyee" : facture.statut,
      updatedAt: new Date(),
    })
    .where(eq(factures.id, factureId));

  revalidatePath(`/factures/${factureId}`);
  revalidatePath("/factures");
  return { url: paymentLink.url };
}

/** Marque une facture payée manuellement (espèces, chèque, virement...). */
export async function markFacturePaidAction(factureId: string): Promise<{ success: boolean }> {
  await requireOwnedFacture(factureId);

  await db
    .update(factures)
    .set({ statut: "payee", datePaiement: new Date(), updatedAt: new Date() })
    .where(eq(factures.id, factureId));

  revalidatePath(`/factures/${factureId}`);
  revalidatePath("/factures");
  return { success: true };
}

/** Marque une facture comme envoyée sans lien de paiement (ex. paiement hors ligne prévu). */
export async function markFactureSentAction(factureId: string): Promise<{ success: boolean }> {
  const facture = await requireOwnedFacture(factureId);
  if (facture.statut !== "brouillon") return { success: true };

  await db.update(factures).set({ statut: "envoyee", updatedAt: new Date() }).where(eq(factures.id, factureId));
  revalidatePath(`/factures/${factureId}`);
  revalidatePath("/factures");
  return { success: true };
}
