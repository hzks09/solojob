"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { isEnRetard } from "@/lib/factures-utils";
import type { Facture } from "@/lib/db/schema";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoyee: "Envoyée",
  payee: "Payée",
};

type Filter = "toutes" | "brouillon" | "envoyee" | "en_retard" | "payee";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "toutes", label: "Toutes" },
  { value: "brouillon", label: "Brouillons" },
  { value: "envoyee", label: "Envoyées" },
  { value: "en_retard", label: "En retard" },
  { value: "payee", label: "Payées" },
];

export function FacturesList({ rows }: { rows: { facture: Facture; clientNom: string }[] }) {
  const [filter, setFilter] = useState<Filter>("toutes");

  const filtered = rows.filter(({ facture }) => {
    if (filter === "toutes") return true;
    if (filter === "en_retard") return isEnRetard(facture);
    if (filter === "envoyee") return facture.statut === "envoyee" && !isEnRetard(facture);
    return facture.statut === filter;
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              filter === f.value ? "border-brand bg-brand/10 text-brand" : "border-card-border text-muted"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted">Aucune facture dans ce filtre.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ facture, clientNom }) => {
            const enRetard = isEnRetard(facture);
            return (
              <Link key={facture.id} href={`/factures/${facture.id}`}>
                <Card className="transition-colors hover:border-brand">
                  <CardContent className="flex items-center justify-between pt-6">
                    <div>
                      <p className="font-medium">
                        {facture.numero} — {clientNom}
                      </p>
                      <p className="text-sm text-muted">{Number(facture.montantTotal).toFixed(2)} €</p>
                    </div>
                    <Badge variant={facture.statut === "payee" ? "accent" : enRetard ? "default" : "outline"}>
                      {enRetard ? "En retard" : STATUT_LABELS[facture.statut]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
