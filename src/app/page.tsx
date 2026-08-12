import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tampon } from "@/components/ui/tampon";
import { PLANS } from "@/lib/constants";

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-card-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-black tracking-tight">
            <span className="inline-block h-6 w-6 rounded-sm bg-brand" />
            SoloJob
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/#pricing" className="text-sm text-muted hover:text-foreground">
              Tarifs
            </Link>
            <Link href="/login" className="text-sm text-muted hover:text-foreground">
              Connexion
            </Link>
            <Link href="/signup" className={buttonVariants({ variant: "action", size: "sm" })}>
              Essayer gratuitement
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-brand px-4 py-24 text-brand-foreground">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-foreground/60">
              Pour artisans et indépendants solos
            </p>
            <h1 className="mx-auto mt-5 max-w-2xl font-display text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">
              Un devis en 60 secondes.
              <br />
              Pas en 20 minutes.
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-brand-foreground/75">
              Fais ton devis depuis le chantier, transforme-le en facture en un clic, encaisse en ligne. SoloJob
              relance tes clients en retard de paiement à ta place.
            </p>
            <div className="mt-8 flex items-center justify-center gap-4">
              <Link href="/signup" className={buttonVariants({ variant: "action", size: "lg" })}>
                Commencer gratuitement
              </Link>
              <span className="hidden sm:inline-block">
                <Tampon variant="envoyee" />
              </span>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-16 text-center">
          <div className="grid gap-8 sm:grid-cols-3">
            <div>
              <p className="font-display text-3xl font-black text-brand">1</p>
              <p className="mt-2 text-sm text-muted">Tu fais le devis sur ton téléphone, entre deux chantiers.</p>
            </div>
            <div>
              <p className="font-display text-3xl font-black text-brand">2</p>
              <p className="mt-2 text-sm text-muted">Le client accepte, tu le transformes en facture en un clic.</p>
            </div>
            <div>
              <p className="font-display text-3xl font-black text-action">3</p>
              <p className="mt-2 text-sm text-muted">Il paie en ligne — ou SoloJob le relance tout seul s&apos;il oublie.</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="mb-10 text-center font-display text-2xl font-black tracking-tight">Des forfaits simples</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {Object.values(PLANS).map((plan) => (
              <Card key={plan.tier} className={plan.tier === "solo" ? "border-2 border-brand" : undefined}>
                <CardContent className="pt-6">
                  <h3 className="font-display text-lg font-black">{plan.name}</h3>
                  <p className="mt-2 font-mono text-3xl font-semibold">
                    {plan.priceMonthly}€<span className="text-sm font-normal text-muted"> /mois</span>
                  </p>
                  <ul className="mt-4 space-y-2 text-sm text-muted">
                    {plan.features.map((f) => (
                      <li key={f}>• {f}</li>
                    ))}
                  </ul>
                  <Link
                    href="/signup"
                    className={buttonVariants({
                      className: "mt-6 w-full",
                      variant: plan.tier === "solo" ? "action" : "outline",
                    })}
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
