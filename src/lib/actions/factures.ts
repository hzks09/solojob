"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, factureLignes, factures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

async function requireUserId() {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");
  return current.authUser.id;
}

export async function listFactures() {
  const userId = await requireUserId();
  return db
    .select({ facture: factures, clientNom: clients.nom })
    .from(factures)
    .innerJoin(clients, eq(factures.clientId, clients.id))
    .where(eq(factures.userId, userId))
    .orderBy(desc(factures.createdAt));
}

export async function getFactureWithLignes(id: string) {
  const userId = await requireUserId();
  const [row] = await db
    .select({ facture: factures, client: clients })
    .from(factures)
    .innerJoin(clients, eq(factures.clientId, clients.id))
    .where(and(eq(factures.id, id), eq(factures.userId, userId)))
    .limit(1);
  if (!row) return null;

  const lignes = await db
    .select()
    .from(factureLignes)
    .where(eq(factureLignes.factureId, id))
    .orderBy(factureLignes.ordre);

  return { ...row, lignes };
}
