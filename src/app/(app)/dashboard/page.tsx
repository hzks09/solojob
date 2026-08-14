import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, devis, factures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isEnRetard } from "@/lib/factures-utils";
import { PLANS } from "@/lib/constants";

export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) return null;
  const userId = current.authUser.id;

  const [[clientCount], [devisCount], allFactures] = await Promise.all([
    db.select({ value: count() }).from(clients).where(eq(clients.userId, userId)),
    db.select({ value: count() }).from(devis).where(eq(devis.userId, userId)),
    db.select().from(factures).where(eq(factures.userId, userId)),
  ]);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const caPayeMois = allFactures
    .filter((f) => f.statut === "payee" && f.datePaiement && new Date(f.datePaiement) >= startOfMonth)
    .reduce((sum, f) => sum + Number(f.montantTotal), 0);

  const enAttente = allFactures
    .filter((f) => f.statut === "envoyee")
    .reduce((sum, f) => sum + Number(f.montantTotal), 0);

  const enRetardCount = allFactures.filter((f) => isEnRetard(f)).length;

  const plan = current.profile?.plan ?? "free";
  const stats = [
    { label: "Clients", value: clientCount.value },
    { label: "Devis", value: devisCount.value },
    { label: "Factures", value: allFactures.length },
    { label: "Forfait", value: PLANS[plan].name },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted">Bienvenue {current.profile?.fullName ?? current.authUser.email}</p>
        </div>
        <Link href="/devis/new" className={buttonVariants({ variant: "action" })}>
          Nouveau devis
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-2 border-accent">
          <CardContent className="pt-6">
            <p className="text-sm text-muted">Payé ce mois-ci</p>
            <p className="mt-1 font-mono text-3xl font-semibold text-accent">{caPayeMois.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card className={enRetardCount > 0 ? "border-2 border-action" : undefined}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted">
              En attente de paiement {enRetardCount > 0 && <span className="text-action">({enRetardCount} en retard)</span>}
            </p>
            <p className="mt-1 font-mono text-3xl font-semibold">{enAttente.toFixed(2)} €</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-1 font-mono text-2xl font-semibold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
