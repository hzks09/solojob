import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { PLANS, PUBLIC_PLAN_TIERS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STEPS = [
  { n: "1", text: "Tu choisis 2-3 centres d'intérêt pour démarrer." },
  { n: "2", text: "On te propose une vidéo à la fois — tu passes ou tu gardes." },
  { n: "3", text: "Tu regardes sur YouTube, NextWatch affine les prochaines." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-card-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-black tracking-tight">
            <Logo className="h-8 w-8" />
            NextWatch
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/#pricing" className="hidden text-sm text-muted hover:text-foreground sm:inline">
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
        {/* HERO */}
        <section className="relative overflow-hidden bg-brand text-brand-foreground">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 78% 25%, color-mix(in srgb, var(--action) 32%, transparent), transparent 55%)",
            }}
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-28">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.25em] text-brand-foreground/50">
                Découverte de vidéos YouTube
              </p>
              <h1 className="mt-5 text-balance font-display text-5xl font-black leading-[0.98] tracking-tight md:text-6xl">
                Une vidéo qui va
                <br />
                vraiment te plaire.
              </h1>
              <p className="mt-3 font-display text-2xl font-black tracking-tight" style={{ color: "var(--action)" }}>
                Pas 20 minutes de scroll.
              </p>
              <p className="mt-6 max-w-md text-brand-foreground/70">
                Dis-nous ce qui te fait envie, swipe les propositions une par une, et regarde. NextWatch affine ce
                qu&apos;il te montre à chaque swipe.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-5">
                <Link href="/signup" className={buttonVariants({ variant: "action", size: "lg" })}>
                  Commencer gratuitement
                </Link>
                <Link
                  href="/#pricing"
                  className="text-sm font-medium text-brand-foreground/70 hover:text-brand-foreground"
                >
                  Voir les tarifs →
                </Link>
              </div>
            </div>

            {/* Visuel — pile de cartes façon swipe */}
            <div className="relative mx-auto h-[340px] w-[260px] md:h-[380px] md:w-[290px]">
              <div className="absolute inset-0 rotate-[9deg] rounded-3xl border border-brand-foreground/10 bg-brand-foreground/5" />
              <div className="absolute inset-0 -rotate-[5deg] rounded-3xl border border-brand-foreground/10 bg-brand-foreground/10" />
              <div className="absolute inset-0 overflow-hidden rounded-3xl border border-brand-foreground/15 bg-[#111113] shadow-2xl">
                <div
                  className="flex aspect-video items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #dc1030 0%, #3a040f 100%)" }}
                >
                  <div
                    aria-hidden
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: "16px solid transparent",
                      borderBottom: "16px solid transparent",
                      borderLeft: "26px solid rgba(255,255,255,0.85)",
                      marginLeft: 6,
                    }}
                  />
                </div>
                <div className="space-y-2 p-4">
                  <div className="h-3 w-4/5 rounded bg-white/20" />
                  <div className="h-2.5 w-2/5 rounded bg-white/10" />
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-sm text-white/70">
                    ✕
                  </span>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-action text-sm text-action-foreground">
                    ♥
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section className="mx-auto max-w-5xl px-4 py-20">
          <h2 className="text-center font-display text-2xl font-black tracking-tight md:text-3xl">
            Comment ça marche
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n} className="rounded-2xl border border-card-border bg-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-action font-display text-sm font-black text-action-foreground">
                  {step.n}
                </span>
                <p className="mt-4 text-sm text-muted">{step.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* TARIFS */}
        <section id="pricing" className="border-t border-card-border bg-card/40 px-4 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center font-display text-2xl font-black tracking-tight md:text-3xl">
              Des forfaits simples
            </h2>
            <div className="mx-auto mt-12 grid max-w-3xl gap-6 md:grid-cols-2">
              {PUBLIC_PLAN_TIERS.map((tier) => PLANS[tier]).map((plan) => {
                const isPaid = plan.tier !== "free";
                return (
                  <div
                    key={plan.tier}
                    className={cn(
                      "rounded-2xl border p-6",
                      isPaid ? "border-action bg-foreground text-background" : "border-card-border bg-card"
                    )}
                  >
                    <h3 className="font-display text-lg font-black">{plan.name}</h3>
                    <p className="mt-2 font-mono text-3xl font-semibold">
                      {plan.priceMonthly}€
                      <span className={cn("text-sm font-normal", isPaid ? "opacity-60" : "text-muted")}> /mois</span>
                    </p>
                    <ul className={cn("mt-4 space-y-2 text-sm", isPaid ? "opacity-80" : "text-muted")}>
                      {plan.features.map((f) => (
                        <li key={f}>• {f}</li>
                      ))}
                    </ul>
                    <Link
                      href="/signup"
                      className={buttonVariants({
                        className: "mt-6 w-full",
                        variant: isPaid ? "action" : "outline",
                      })}
                    >
                      Choisir {plan.name}
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-card-border px-4 py-8 text-center text-sm text-muted">
        <p>© {new Date().getFullYear()} NextWatch. Tous droits réservés.</p>
        <nav className="mt-3 flex items-center justify-center gap-4 text-xs">
          <Link href="/mentions-legales" className="hover:text-foreground">
            Mentions légales
          </Link>
          <Link href="/cgu" className="hover:text-foreground">
            CGU
          </Link>
          <Link href="/confidentialite" className="hover:text-foreground">
            Confidentialité
          </Link>
        </nav>
      </footer>
    </div>
  );
}
