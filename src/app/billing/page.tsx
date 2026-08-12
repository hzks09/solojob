import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { subscriptions, users } from "@/lib/db/schema";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ManageSubscriptionButton, UpgradeButton } from "@/components/billing/plan-actions";
import { PLANS } from "@/lib/constants";

export default async function BillingPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [dbUser] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, session.user.id))
    .limit(1);

  const currentPlan = dbUser?.plan ?? "free";

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
        <p className="mt-1 text-sm text-muted">Gère ton forfait et tes crédits</p>

        <Card className="mt-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle>Forfait actuel : {PLANS[currentPlan].name}</CardTitle>
              {subscription && <Badge variant="outline">{subscription.status}</Badge>}
            </div>
            <CardDescription>
              {currentPlan === "free"
                ? `${dbUser?.creditsRemaining ?? 0} crédit(s) restant(s)`
                : "Générations illimitées"}
            </CardDescription>
          </CardHeader>
          {dbUser?.stripeCustomerId && (
            <CardContent>
              <ManageSubscriptionButton />
            </CardContent>
          )}
        </Card>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {Object.values(PLANS).map((plan) => (
            <Card key={plan.tier} className={currentPlan === plan.tier ? "border-brand" : undefined}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className="mt-2 text-3xl font-semibold">
                  {plan.priceMonthly}€<span className="text-sm font-normal text-muted">/mois</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-muted">
                  {plan.features.map((f) => (
                    <li key={f}>• {f}</li>
                  ))}
                </ul>
                <div className="mt-6">
                  {plan.tier === "free" ? (
                    <p className="text-center text-xs text-muted">Forfait par défaut</p>
                  ) : currentPlan === plan.tier ? (
                    <p className="text-center text-xs text-muted">Forfait actif</p>
                  ) : (
                    <UpgradeButton plan={plan.tier as "pro" | "premium"} label={`Passer à ${plan.name}`} />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
