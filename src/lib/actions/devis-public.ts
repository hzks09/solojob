"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients, devis, devisLignes, profiles } from "@/lib/db/schema";

/**
 * Lecture et actions publiques sur un devis, accessibles par lien direct
 * (UUID non énumérable) sans authentification — c'est le client final qui
 * consulte et accepte/refuse son devis ici, pas l'artisan connecté.
 */
export async function getPublicDevis(id: string) {
  const [row] = await db
    .select({ devis, client: clients, artisan: profiles })
    .from(devis)
    .innerJoin(clients, eq(devis.clientId, clients.id))
    .innerJoin(profiles, eq(devis.userId, profiles.id))
    .where(eq(devis.id, id))
    .limit(1);
  if (!row) return null;

  const lignes = await db.select().from(devisLignes).where(eq(devisLignes.devisId, id)).orderBy(devisLignes.ordre);
  return { ...row, lignes };
}

async function respondToPublicDevis(id: string, next: "accepte" | "refuse") {
  const [existing] = await db.select().from(devis).where(eq(devis.id, id)).limit(1);
  if (!existing) return { success: false as const, error: "Devis introuvable" };
  if (existing.statut !== "envoye") {
    return { success: false as const, error: "Ce devis n'est plus modifiable" };
  }

  await db.update(devis).set({ statut: next, updatedAt: new Date() }).where(eq(devis.id, id));
  revalidatePath(`/d/${id}`);
  revalidatePath(`/devis/${id}`);
  revalidatePath("/devis");
  return { success: true as const };
}

export async function acceptPublicDevisAction(id: string) {
  return respondToPublicDevis(id, "accepte");
}

export async function refusePublicDevisAction(id: string) {
  return respondToPublicDevis(id, "refuse");
}
