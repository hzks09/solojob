import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { clients, devis, factures } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const current = await getCurrentUser();
  if (!current) return null;
  const userId = current.authUser.id;

  const [[clientCount], [devisCount], [factureCount]] = await Promise.all([
    db.select({ value: count() }).from(clients).where(eq(clients.userId, userId)),
    db.select({ value: count() }).from(devis).where(eq(devis.userId, userId)),
    db.select({ value: count() }).from(factures).where(eq(factures.userId, userId)),
  ]);

  const stats = [
    { label: "Clients", value: clientCount.value },
    { label: "Devis", value: devisCount.value },
    { label: "Factures", value: factureCount.value },
    { label: "Forfait", value: current.profile?.plan ?? "free" },
  ];

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="mt-1 text-sm text-muted">Bienvenue {current.profile?.fullName ?? current.authUser.email}</p>
        </div>
        <Link href="/devis/new" className={buttonVariants()}>
          Nouveau devis
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold capitalize">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
