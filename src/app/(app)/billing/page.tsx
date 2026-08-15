import { getCurrentUser } from "@/lib/auth/current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageSubscriptionButton, UpgradeButton } from "@/components/billing/plan-actions";
import { PlanCard } from "@/components/billing/plan-card";
import { PLANS, PUBLIC_PLAN_TIERS } from "@/lib/constants";

export default async function BillingPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const currentPlan = current.profile?.plan ?? "free";

  return (
    <div>
      <h1 className="font-display text-2xl font-black tracking-tight">Abonnement</h1>
      <p className="mt-1 text-sm text-muted">Gère ton forfait SoloJob</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="font-display text-lg font-black tracking-tight">
            Forfait actuel : {PLANS[currentPlan].name}
          </CardTitle>
          <CardDescription>
            {currentPlan === "free"
              ? `${PLANS.free.factureLimit} factures par mois`
              : "Facturation illimitée"}
          </CardDescription>
        </CardHeader>
        {current.profile?.stripeCustomerId && (
          <CardContent>
            <ManageSubscriptionButton />
          </CardContent>
        )}
      </Card>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {PUBLIC_PLAN_TIERS.map((tier) => PLANS[tier]).map((plan) => (
          <PlanCard
            key={plan.tier}
            plan={plan}
            highlighted={currentPlan === plan.tier}
            cta={
              plan.tier === "free" ? (
                <p className="text-center text-xs text-muted">Forfait par défaut</p>
              ) : currentPlan === plan.tier ? (
                <p className="text-center text-xs text-muted">Forfait actif</p>
              ) : (
                <UpgradeButton plan={plan.tier as "solo" | "solo_plus"} label={`Passer à ${plan.name}`} />
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
