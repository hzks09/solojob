"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const LINKS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/studio", label: "Studio" },
  { href: "/history", label: "Historique" },
  { href: "/favorites", label: "Favoris" },
  { href: "/gallery", label: "Galerie" },
  { href: "/billing", label: "Abonnement" },
];

export function DashboardNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-20 glass">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-block h-6 w-6 rounded-md bg-brand" />
            RoomAI
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  pathname === link.href ? "bg-brand/10 text-brand" : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
            {session?.user.role === "admin" && (
              <Link
                href="/admin"
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm transition-colors",
                  pathname.startsWith("/admin") ? "bg-brand/10 text-brand" : "text-muted hover:text-foreground"
                )}
              >
                Admin
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user && <Badge variant="outline">{session.user.plan}</Badge>}
          <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/" })}>
            Déconnexion
          </Button>
        </div>
      </div>
    </header>
  );
}
