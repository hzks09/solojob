import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Hero } from "@/components/marketing/hero";
import { DESIGN_STYLES, PLANS, ROOM_TYPES } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Hero />

      <main>
        <section id="styles" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-6 text-center text-2xl font-semibold">Toutes les pièces, tous les styles</h2>
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            {ROOM_TYPES.map((r) => (
              <span key={r.value} className="rounded-full border border-card-border px-4 py-2 text-sm">
                {r.label}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {DESIGN_STYLES.map((s) => (
              <span key={s.value} className="rounded-full bg-brand/10 px-4 py-2 text-sm text-brand">
                {s.label}
              </span>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">Des forfaits simples</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.values(PLANS).map((plan) => (
              <Card key={plan.tier} className={plan.tier === "pro" ? "border-brand" : undefined}>
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
                  <Link
                    href="/signup"
                    className={buttonVariants({ className: "mt-6 w-full", variant: plan.tier === "pro" ? "default" : "outline" })}
                  >
                    Choisir {plan.name}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-card-border px-4 py-8 text-center text-sm text-muted">
        © {new Date().getFullYear()} RoomAI. Tous droits réservés.
      </footer>
    </div>
  );
}
