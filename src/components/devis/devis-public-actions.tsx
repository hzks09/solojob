"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { acceptPublicDevisAction, refusePublicDevisAction } from "@/lib/actions/devis-public";
import type { DevisStatut } from "@/lib/db/schema";

export function DevisPublicActions({ devisId, statut }: { devisId: string; statut: DevisStatut }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accepte" | "refuse" | null>(null);

  if (statut === "accepte") {
    return <p className="text-center text-sm font-medium text-accent">Devis accepté — l&apos;artisan a été prévenu.</p>;
  }
  if (statut === "refuse") {
    return <p className="text-center text-sm text-muted">Devis refusé.</p>;
  }
  if (statut !== "envoye") {
    return <p className="text-center text-sm text-muted">Ce devis n&apos;est pas encore prêt à être consulté.</p>;
  }

  async function handle(action: "accepte" | "refuse") {
    if (action === "refuse" && !confirm("Refuser ce devis ?")) return;

    setLoading(action);
    const result = action === "accepte" ? await acceptPublicDevisAction(devisId) : await refusePublicDevisAction(devisId);
    setLoading(null);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(action === "accepte" ? "Devis accepté !" : "Devis refusé.");
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <Button variant="action" size="lg" className="flex-1" disabled={loading !== null} onClick={() => handle("accepte")}>
        {loading === "accepte" ? "..." : "J'accepte ce devis"}
      </Button>
      <Button variant="outline" size="lg" disabled={loading !== null} onClick={() => handle("refuse")}>
        {loading === "refuse" ? "..." : "Je refuse"}
      </Button>
    </div>
  );
}
