"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tampon } from "@/components/ui/tampon";
import { createPaymentLinkAction, markFacturePaidAction, markFactureSentAction } from "@/lib/actions/facture-payment";
import type { Facture } from "@/lib/db/schema";

export function FactureActions({ facture }: { facture: Facture }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showStamp, setShowStamp] = useState(false);

  async function handleCreateLink() {
    setLoading("link");
    try {
      const { url } = await createPaymentLinkAction(facture.id);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Lien de paiement créé et copié.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ça n'a pas marché. Réessaie.");
    } finally {
      setLoading(null);
    }
  }

  async function handleMarkSent() {
    setLoading("sent");
    await markFactureSentAction(facture.id);
    setLoading(null);
    toast.success("Facture envoyée.");
    router.refresh();
  }

  async function handleMarkPaid() {
    if (!confirm("Cette facture a été payée (chèque, espèces, virement...) ?")) return;
    setLoading("paid");
    await markFacturePaidAction(facture.id);
    setLoading(null);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      toast.success("Payée, direct.");
      router.refresh();
      return;
    }

    setShowStamp(true);
    setTimeout(() => {
      setShowStamp(false);
      router.refresh();
    }, 850);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {showStamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" aria-live="polite">
          <Tampon variant="payee" animate className="!text-3xl !px-6 !py-3" />
        </div>
      )}

      <a href={`/api/factures/${facture.id}/pdf`} target="_blank" rel="noopener noreferrer">
        <Button type="button" variant="outline">
          Télécharger le PDF
        </Button>
      </a>

      {facture.statut !== "payee" && (
        <>
          <Button type="button" variant="outline" disabled={loading !== null} onClick={handleCreateLink}>
            {loading === "link" ? "Création..." : facture.stripePaymentLinkUrl ? "Copier le lien de paiement" : "Créer un lien de paiement"}
          </Button>
          {facture.statut === "brouillon" && (
            <Button type="button" variant="ghost" disabled={loading !== null} onClick={handleMarkSent}>
              {loading === "sent" ? "..." : "Marquer comme envoyée"}
            </Button>
          )}
          <Button type="button" variant="action" disabled={loading !== null} onClick={handleMarkPaid}>
            {loading === "paid" ? "..." : "Marquer comme payée"}
          </Button>
        </>
      )}
    </div>
  );
}
