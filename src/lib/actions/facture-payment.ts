"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { factures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

async function requireOwnedFacture(factureId: string) {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");

  const [facture] = await db
    .select()
    .from(factures)
    .where(and(eq(factures.id, factureId), eq(factures.userId, current.authUser.id)))
    .limit(1);
  if (!facture) throw new Error("Facture introuvable");

  return { facture, profile: current.profile };
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

/** Marque une facture comme envoyée (ex. lien PayPal partagé, paiement hors ligne prévu). */
export async function markFactureSentAction(factureId: string): Promise<{ success: boolean }> {
  const { facture } = await requireOwnedFacture(factureId);
  if (facture.statut !== "brouillon") return { success: true };

  await db.update(factures).set({ statut: "envoyee", updatedAt: new Date() }).where(eq(factures.id, factureId));
  revalidatePath(`/factures/${factureId}`);
  revalidatePath("/factures");
  return { success: true };
}
