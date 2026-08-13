"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { LayoutDashboard, Users, FileText, Receipt, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/logo";
import type { PlanTier } from "@/lib/db/schema";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/clients", label: "Clients" },
  { href: "/devis", label: "Devis" },
  { href: "/factures", label: "Factures" },
  { href: "/billing", label: "Abonnement" },
  { href: "/settings", label: "Réglages" },
];

/** Barre du bas sur mobile — plus facile à atteindre au pouce sur un chantier qu'un menu hamburger. */
const MOBILE_TABS = [
  { href: "/dashboard", label: "Accueil", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/devis", label: "Devis", icon: FileText },
  { href: "/factures", label: "Factures", icon: Receipt },
  { href: "/settings", label: "Réglages", icon: Settings },
];

export function DashboardNav({ plan }: { plan?: PlanTier }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 z-20 glass">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2 font-display text-base font-black tracking-tight">
              <Logo className="h-6 w-6" />
              SoloJob
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm transition-colors",
                    pathname.startsWith(link.href) ? "bg-brand/10 text-brand" : "text-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {plan && <Badge variant="outline">{plan}</Badge>}
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <nav className="glass fixed inset-x-0 bottom-0 z-20 flex items-stretch justify-around border-t border-card-border md:hidden">
        {MOBILE_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs",
                active ? "text-brand" : "text-muted"
              )}
            >
              <Icon className="h-5 w-5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
