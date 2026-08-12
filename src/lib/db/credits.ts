import { sql } from "drizzle-orm";
import { db } from "./index";
import type { CreditReason } from "./schema";

export type { CreditReason };

/**
 * Débite les crédits d'un utilisateur de façon atomique en une seule requête SQL
 * (CTE : UPDATE conditionnel + INSERT du mouvement dans le ledger).
 * Fonctionne sans transaction multi-requêtes explicite — nécessaire car le driver
 * HTTP Neon exécute chaque requête indépendamment.
 *
 * Note : `credits_ledger.id` n'a pas de défaut au niveau SQL (le
 * `$defaultFn` de Drizzle ne s'applique qu'aux inserts via le query builder),
 * donc on génère l'id explicitement ici pour ce SQL brut.
 *
 * @returns `true` si le débit a eu lieu, `false` si le solde était insuffisant.
 */
export async function consumeCredits(
  userId: string,
  amount: number,
  reason: CreditReason,
  generationId?: string
): Promise<boolean> {
  const ledgerId = crypto.randomUUID();

  const result = await db.execute(sql`
    with updated as (
      update users
      set credits_remaining = credits_remaining - ${amount}
      where id = ${userId} and credits_remaining >= ${amount}
      returning id
    )
    insert into credits_ledger (id, user_id, amount, reason, generation_id)
    select ${ledgerId}, ${userId}, ${-amount}, ${reason}, ${generationId ?? null}
    from updated
    returning id
  `);

  return result.rows.length > 0;
}

/** Crédite (ajoute) des crédits — utilisé par les webhooks Stripe et l'admin. */
export async function grantCredits(
  userId: string,
  amount: number,
  reason: CreditReason,
  metadata: Record<string, unknown> = {}
): Promise<void> {
  const ledgerId = crypto.randomUUID();

  await db.execute(sql`
    with updated as (
      update users
      set credits_remaining = credits_remaining + ${amount}
      where id = ${userId}
      returning id
    )
    insert into credits_ledger (id, user_id, amount, reason, metadata)
    select ${ledgerId}, ${userId}, ${amount}, ${reason}, ${JSON.stringify(metadata)}::jsonb
    from updated
  `);
}
