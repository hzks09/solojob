"use server";

import { and, count, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { factures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PLANS } from "@/lib/constants";

/**
 * Nombre de factures créées ce mois-ci (brouillons compris) pour le forfait
 * Gratuit — même fenêtre et même règle de comptage que la vérification de
 * quota dans `convertDevisToFactureAction`. Renvoie `null` pour un forfait
 * illimité (rien à afficher).
 */
export async function getFreePlanUsage(): Promise<{ used: number; limit: number } | null> {
  const current = await getCurrentUser();
  if (!current) return null;

  const plan = current.profile?.plan ?? "free";
  const planConfig = PLANS[plan];
  if (planConfig.factureLimit === "illimite") return null;

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ value: used }] = await db
    .select({ value: count() })
    .from(factures)
    .where(and(eq(factures.userId, current.authUser.id), gte(factures.createdAt, startOfMonth)));

  return { used, limit: planConfig.factureLimit };
}
