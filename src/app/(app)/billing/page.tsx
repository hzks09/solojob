import { getCurrentUser } from "@/lib/auth/current-user";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManageSubscriptionButton, UpgradeButton } from "@/components/billing/plan-actions";
import { PLANS } from "@/lib/constants";

export default async function BillingPage() {
  const current = await getCurrentUser();
  if (!current) return null;

  const currentPlan = current.profile?.plan ?? "free";

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Abonnement</h1>
      <p className="mt-1 text-sm text-muted">Gère ton forfait SoloJob</p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Forfait actuel : {PLANS[currentPlan].name}</CardTitle>
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
                  <UpgradeButton plan={plan.tier as "solo" | "solo_plus"} label={`Passer à ${plan.name}`} />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
