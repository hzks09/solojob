"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Silkscreen } from "next/font/google";
import { ChevronDown, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DESIGN_STYLES } from "@/lib/constants";

const silkscreen = Silkscreen({ subsets: ["latin"], weight: ["400", "700"] });

const CTA_GRADIENT = "linear-gradient(to bottom, #2B2B2B, #101010)";

const NAV_LINKS = [
  { label: "Galerie", href: "/gallery" },
  { label: "Styles", href: "#styles", hasChevron: true },
  { label: "Tarifs", href: "#pricing" },
  { label: "Connexion", href: "/login" },
];

/**
 * Hero plein écran (cinématique, glassmorphism) — reprend un pattern de mise
 * en page inspiré d'une maquette fournie, mais avec le vrai contenu RoomAI :
 * pas de faux témoignage, pas de fausse statistique. Le fond vidéo tiers non
 * vérifié de la maquette d'origine est remplacé par un dégradé aux couleurs
 * de la marque (zéro dépendance externe).
 */
export function Hero() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#0c0a08]">
      <div
        aria-hidden
        className="absolute inset-0 h-full w-full"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 20% 10%, rgba(181,101,47,0.38), transparent 60%), radial-gradient(ellipse 70% 55% at 85% 90%, rgba(47,82,51,0.32), transparent 60%), linear-gradient(180deg, #17120d 0%, #0a0807 100%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <nav className="flex items-center justify-between px-5 py-5 sm:px-8 sm:py-6 lg:px-12">
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="inline-block h-6 w-6 rounded-md bg-brand" />
            <span className="text-lg font-semibold">RoomAI</span>
          </Link>

          <div className="hidden items-center gap-3 md:flex">
            <div className="flex items-center gap-1 rounded-full bg-white/10 px-1.5 py-1.5 backdrop-blur-lg">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  className="flex items-center gap-1 rounded-full px-4 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                  {link.hasChevron && <ChevronDown className="h-3.5 w-3.5" />}
                </Link>
              ))}
            </div>
            <Link
              href="/signup"
              className="flex items-center self-stretch rounded-full px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: CTA_GRADIENT }}
            >
              Essayer gratuitement
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className="relative z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-lg md:hidden"
          >
            <Menu
              className={cn(
                "absolute h-5 w-5 transition-all duration-300",
                menuOpen ? "rotate-90 scale-0 opacity-0" : "opacity-100"
              )}
            />
            <X
              className={cn(
                "absolute h-5 w-5 transition-all duration-300",
                menuOpen ? "opacity-100" : "-rotate-90 scale-0 opacity-0"
              )}
            />
          </button>
        </nav>

        <div
          onClick={() => setMenuOpen(false)}
          className={cn(
            "fixed inset-0 z-40 bg-black/80 backdrop-blur-md transition-opacity duration-300 md:hidden",
            menuOpen ? "opacity-100" : "pointer-events-none opacity-0"
          )}
        />

        <div
          className={cn(
            "fixed right-0 top-0 z-40 flex h-full w-72 flex-col bg-black/90 backdrop-blur-xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:hidden",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex flex-col gap-2 px-6 pt-24">
            {NAV_LINKS.map((link, i) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                style={{
                  transitionProperty: "opacity, transform",
                  transitionDuration: "300ms",
                  transitionDelay: menuOpen ? `${(i + 1) * 60}ms` : "0ms",
                  opacity: menuOpen ? 1 : 0,
                  transform: menuOpen ? "translateX(0)" : "translateX(24px)",
                }}
              >
                {link.label}
                {link.hasChevron && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>
            ))}
          </div>
          <Link
            href="/signup"
            onClick={() => setMenuOpen(false)}
            className="mx-6 mb-10 mt-auto rounded-full px-6 py-3 text-center text-sm font-medium text-white"
            style={{
              background: CTA_GRADIENT,
              transitionProperty: "opacity, transform",
              transitionDuration: "400ms",
              transitionDelay: menuOpen ? "300ms" : "0ms",
              opacity: menuOpen ? 1 : 0,
              transform: menuOpen ? "translateY(0)" : "translateY(16px)",
            }}
          >
            Essayer gratuitement
          </Link>
        </div>

        <main className="mt-auto flex flex-col gap-6 px-5 pb-8 sm:gap-8 sm:px-8 sm:pb-12 lg:flex-row lg:items-end lg:justify-between lg:px-12 lg:pb-16">
          <div className="max-w-xl">
            <h1 className="text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[3.5rem]">
              Réinvente n&apos;importe quelle pièce en quelques secondes
            </h1>

            <form
              action="/signup"
              className="mt-6 flex flex-col gap-3 sm:mt-8 sm:inline-flex sm:flex-row sm:items-center sm:rounded-full sm:bg-white sm:p-1.5"
            >
              <input
                type="email"
                name="email"
                placeholder="Type your email"
                className="rounded-full bg-white px-5 py-3 text-sm text-gray-900 outline-none placeholder-gray-400 sm:w-64 sm:rounded-none sm:bg-transparent sm:px-4 sm:py-2"
              />
              <button
                type="submit"
                className="rounded-full px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:py-2.5"
                style={{ background: CTA_GRADIENT }}
              >
                Essayer gratuitement
              </button>
            </form>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row lg:w-auto lg:gap-5">
            <div className="flex flex-col justify-between rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
              <p className={cn(silkscreen.className, "text-3xl tracking-tight text-white sm:text-4xl")}>
                {DESIGN_STYLES.length}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-white/70 sm:mt-4">
                Styles de design différents, du minimaliste au futuriste — un pour chaque pièce.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-5 backdrop-blur-lg sm:w-64 sm:p-6">
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-white text-xs font-bold text-black">
                  R
                </span>
                <span className="text-sm font-semibold text-white">Shopping intelligent</span>
              </div>
              <p className="text-sm leading-relaxed text-white/80">
                Chaque génération détecte le mobilier et propose un budget total, avec des alternatives moins chères
                ou haut de gamme.
              </p>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
}
