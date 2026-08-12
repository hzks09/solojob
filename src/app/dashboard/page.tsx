import { count, desc, eq } from "drizzle-orm";
import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generations, projects, users } from "@/lib/db/schema";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { PLANS } from "@/lib/constants";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [[projectCount], [generationCount], [dbUser], recentGenerations] = await Promise.all([
    db.select({ value: count() }).from(projects).where(eq(projects.userId, session.user.id)),
    db.select({ value: count() }).from(generations).where(eq(generations.userId, session.user.id)),
    db.select().from(users).where(eq(users.id, session.user.id)).limit(1),
    db
      .select()
      .from(generations)
      .where(eq(generations.userId, session.user.id))
      .orderBy(desc(generations.createdAt))
      .limit(6),
  ]);

  const planConfig = PLANS[dbUser?.plan ?? "free"];

  const stats = [
    { label: "Projets", value: projectCount.value },
    { label: "Générations", value: generationCount.value },
    { label: "Crédits restants", value: dbUser?.creditsRemaining ?? 0 },
    { label: "Forfait", value: planConfig.name },
  ];

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
            <p className="mt-1 text-sm text-muted">Bienvenue {session.user.name ?? session.user.email}</p>
          </div>
          <Link href="/studio" className={buttonVariants()}>
            Nouvelle génération
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardContent className="pt-6">
                <p className="text-sm text-muted">{s.label}</p>
                <p className="mt-1 text-2xl font-semibold">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">Générations récentes</h2>
          {recentGenerations.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Aucune génération pour l&apos;instant</CardTitle>
                <CardDescription>Lance ta première transformation depuis le Studio.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {recentGenerations.map((g) => (
                <Card key={g.id} className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.resultImageUrl ?? g.originalImageUrl}
                    alt={g.style}
                    className="aspect-square w-full object-cover"
                  />
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium capitalize">{g.style}</p>
                    <p className="text-xs text-muted capitalize">{g.status}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
