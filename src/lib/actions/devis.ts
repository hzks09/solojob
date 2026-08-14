"use server";

import { and, count, desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clients, devis, devisLignes, factureLignes, factures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { devisSchema, computeTotal, type DevisInput } from "@/lib/validations/devis";
import { PLANS } from "@/lib/constants";

async function requireUserId() {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");
  return current.authUser.id;
}

async function requireCurrentUser() {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");
  return current;
}

/** Numéro séquentiel par utilisateur et par année, ex. "DEV-2026-003". */
async function nextNumero(userId: string, prefix: "DEV" | "FAC") {
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);
  const table = prefix === "DEV" ? devis : factures;
  const [{ value }] = await db
    .select({ value: count() })
    .from(table)
    .where(and(eq(table.userId, userId), gte(table.createdAt, startOfYear)));

  return `${prefix}-${new Date().getFullYear()}-${String(value + 1).padStart(3, "0")}`;
}

export async function listDevis() {
  const userId = await requireUserId();
  return db
    .select({ devis, clientNom: clients.nom })
    .from(devis)
    .innerJoin(clients, eq(devis.clientId, clients.id))
    .where(eq(devis.userId, userId))
    .orderBy(desc(devis.createdAt));
}

export async function getDevisWithLignes(id: string) {
  const userId = await requireUserId();
  const [row] = await db
    .select({ devis, client: clients })
    .from(devis)
    .innerJoin(clients, eq(devis.clientId, clients.id))
    .where(and(eq(devis.id, id), eq(devis.userId, userId)))
    .limit(1);
  if (!row) return null;

  const lignes = await db.select().from(devisLignes).where(eq(devisLignes.devisId, id)).orderBy(devisLignes.ordre);
  return { ...row, lignes };
}

type ActionResult = { success: true; id: string } | { success: false; error: string };

export async function createDevisAction(input: DevisInput): Promise<ActionResult> {
  const parsed = devisSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const userId = await requireUserId();

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, parsed.data.clientId), eq(clients.userId, userId)))
    .limit(1);
  if (!client) return { success: false, error: "Client introuvable" };

  const numero = await nextNumero(userId, "DEV");
  const montantTotal = computeTotal(parsed.data.lignes);

  const [created] = await db
    .insert(devis)
    .values({
      userId,
      clientId: parsed.data.clientId,
      numero,
      montantTotal: montantTotal.toFixed(2),
      dateValidite: parsed.data.dateValidite || null,
    })
    .returning();

  await db.insert(devisLignes).values(
    parsed.data.lignes.map((l, i) => ({
      devisId: created.id,
      description: l.description,
      quantite: l.quantite.toFixed(2),
      prixUnitaire: l.prixUnitaire.toFixed(2),
      ordre: i,
    }))
  );

  revalidatePath("/devis");
  return { success: true, id: created.id };
}

export async function updateDevisAction(id: string, input: DevisInput): Promise<ActionResult> {
  const parsed = devisSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const userId = await requireUserId();

  const [existing] = await db.select().from(devis).where(and(eq(devis.id, id), eq(devis.userId, userId))).limit(1);
  if (!existing) return { success: false, error: "Devis introuvable" };

  const montantTotal = computeTotal(parsed.data.lignes);

  await db
    .update(devis)
    .set({
      clientId: parsed.data.clientId,
      montantTotal: montantTotal.toFixed(2),
      dateValidite: parsed.data.dateValidite || null,
      updatedAt: new Date(),
    })
    .where(eq(devis.id, id));

  await db.delete(devisLignes).where(eq(devisLignes.devisId, id));
  await db.insert(devisLignes).values(
    parsed.data.lignes.map((l, i) => ({
      devisId: id,
      description: l.description,
      quantite: l.quantite.toFixed(2),
      prixUnitaire: l.prixUnitaire.toFixed(2),
      ordre: i,
    }))
  );

  revalidatePath("/devis");
  revalidatePath(`/devis/${id}`);
  return { success: true, id };
}

/** Passe le devis en "envoyé" (s'il était brouillon) et renvoie le lien public à transmettre au client. */
export async function markDevisSentAction(id: string): Promise<{ success: boolean; url?: string; error?: string }> {
  const userId = await requireUserId();
  const [existing] = await db.select().from(devis).where(and(eq(devis.id, id), eq(devis.userId, userId))).limit(1);
  if (!existing) return { success: false, error: "Devis introuvable" };

  if (existing.statut === "brouillon") {
    await db.update(devis).set({ statut: "envoye", updatedAt: new Date() }).where(eq(devis.id, id));
    revalidatePath(`/devis/${id}`);
    revalidatePath("/devis");
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return { success: true, url: `${appUrl}/d/${id}` };
}

export async function deleteDevisAction(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await requireUserId();
  const [existing] = await db.select().from(devis).where(and(eq(devis.id, id), eq(devis.userId, userId))).limit(1);
  if (!existing) return { success: false, error: "Devis introuvable" };

  await db.delete(devis).where(eq(devis.id, id));
  revalidatePath("/devis");
  return { success: true };
}

/** Copie un devis en facture brouillon (mêmes lignes, même client). */
export async function convertDevisToFactureAction(devisId: string) {
  const { authUser, profile } = await requireCurrentUser();
  const userId = authUser.id;

  const [current] = await db
    .select()
    .from(devis)
    .where(and(eq(devis.id, devisId), eq(devis.userId, userId)))
    .limit(1);
  if (!current) throw new Error("Devis introuvable");

  const [client] = await db.select().from(clients).where(eq(clients.id, current.clientId)).limit(1);
  if (!client) throw new Error("Client introuvable");

  // Plan gratuit : limite de factures par mois (brouillons inclus, pour éviter le contournement).
  const plan = profile?.plan ?? "free";
  const planConfig = PLANS[plan];

  if (planConfig.factureLimit !== "illimite") {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const [{ value: countThisMonth }] = await db
      .select({ value: count() })
      .from(factures)
      .where(and(eq(factures.userId, userId), gte(factures.createdAt, startOfMonth)));

    if (countThisMonth >= planConfig.factureLimit) {
      throw new Error(
        `Limite de ${planConfig.factureLimit} factures/mois atteinte pour le forfait Gratuit. Passe au forfait Solo pour du illimité.`
      );
    }
  }

  const lignes = await db.select().from(devisLignes).where(eq(devisLignes.devisId, devisId)).orderBy(devisLignes.ordre);

  const numero = await nextNumero(userId, "FAC");
  const dateEcheance = new Date();
  dateEcheance.setDate(dateEcheance.getDate() + 30);

  const [facture] = await db
    .insert(factures)
    .values({
      userId,
      clientId: current.clientId,
      devisId: current.id,
      numero,
      statut: "brouillon",
      montantTotal: current.montantTotal,
      dateEmission: new Date().toISOString().slice(0, 10),
      dateEcheance: dateEcheance.toISOString().slice(0, 10),
    })
    .returning();

  if (lignes.length > 0) {
    await db.insert(factureLignes).values(
      lignes.map((l) => ({
        factureId: facture.id,
        description: l.description,
        quantite: l.quantite,
        prixUnitaire: l.prixUnitaire,
        ordre: l.ordre,
      }))
    );
  }

  await db.update(devis).set({ statut: "accepte", updatedAt: new Date() }).where(eq(devis.id, devisId));

  revalidatePath("/devis");
  revalidatePath("/factures");
  redirect(`/factures/${facture.id}`);
}
