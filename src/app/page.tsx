import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PLANS } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="glass sticky top-0 z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-6 w-6 rounded-md bg-brand" />
            SoloJob
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/#pricing" className="text-sm text-muted hover:text-foreground">
              Tarifs
            </Link>
            <Link href="/login" className="text-sm text-muted hover:text-foreground">
              Connexion
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "sm" })}>
              Essayer gratuitement
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden px-4 py-24 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_10%,rgba(181,101,47,0.15),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(47,82,51,0.12),transparent_45%)]"
          />
          <p className="text-sm font-medium text-brand">Pour artisans et indépendants solos</p>
          <h1 className="mx-auto mt-4 max-w-2xl text-4xl font-semibold tracking-tight md:text-6xl">
            Fais tes devis et factures depuis ton chantier
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted">
            Crée un devis en 2 minutes, transforme-le en facture en un clic, encaisse en ligne, et laisse SoloJob
            relancer tes clients en retard à ta place.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className={buttonVariants({ size: "lg" })}>
              Commencer gratuitement
            </Link>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-10 text-center text-2xl font-semibold">Des forfaits simples</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.values(PLANS).map((plan) => (
              <Card key={plan.tier} className={plan.tier === "solo" ? "border-brand" : undefined}>
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
                    className={buttonVariants({ className: "mt-6 w-full", variant: plan.tier === "solo" ? "default" : "outline" })}
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
        © {new Date().getFullYear()} SoloJob. Tous droits réservés.
      </footer>
    </div>
  );
}
