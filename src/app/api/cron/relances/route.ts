import { NextResponse } from "next/server";
import { and, eq, gte, lt, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, factures, profiles, relances } from "@/lib/db/schema";
import { sendRelanceEmail } from "@/lib/email/resend";

/**
 * Job planifié quotidien (Vercel Cron, voir vercel.json) : repère les
 * factures en retard, envoie une relance par e-mail, et enregistre l'envoi
 * dans `relances` pour ne jamais relancer deux fois la même facture le même
 * jour. Protégé par CRON_SECRET (en-tête envoyé automatiquement par Vercel
 * Cron quand la variable d'env CRON_SECRET est définie sur le projet).
 *
 * Les relances automatiques sont une fonctionnalité payante (forfaits Solo
 * et Solo+) — exclues ici pour les comptes au forfait Gratuit.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const startOfToday = new Date(new Date().toDateString());

  const enRetard = await db
    .select({ facture: factures, client: clients, artisan: profiles })
    .from(factures)
    .innerJoin(clients, eq(factures.clientId, clients.id))
    .innerJoin(profiles, eq(factures.userId, profiles.id))
    .where(and(eq(factures.statut, "envoyee"), lt(factures.dateEcheance, today), ne(profiles.plan, "free")));

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const { facture, client, artisan } of enRetard) {
    if (!client.email) {
      skipped++;
      continue;
    }

    const [alreadySentToday] = await db
      .select({ id: relances.id })
      .from(relances)
      .where(and(eq(relances.factureId, facture.id), gte(relances.dateEnvoi, startOfToday)))
      .limit(1);

    if (alreadySentToday) {
      skipped++;
      continue;
    }

    try {
      await sendRelanceEmail({
        to: client.email,
        clientNom: client.nom,
        factureNumero: facture.numero,
        montant: Number(facture.montantTotal).toFixed(2),
        artisanNom: artisan.companyName || artisan.fullName || "ton artisan",
        paymentLinkUrl: facture.stripePaymentLinkUrl,
      });
      await db.insert(relances).values({ factureId: facture.id, type: "email", statut: "envoyee" });
      sent++;
    } catch (err) {
      await db.insert(relances).values({ factureId: facture.id, type: "email", statut: "echec" });
      errors.push(`${facture.numero}: ${err instanceof Error ? err.message : "erreur inconnue"}`);
    }
  }

  return NextResponse.json({ checked: enRetard.length, sent, skipped, errors });
}
