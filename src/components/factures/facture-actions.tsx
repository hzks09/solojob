"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createPaymentLinkAction, markFacturePaidAction, markFactureSentAction } from "@/lib/actions/facture-payment";
import type { Facture } from "@/lib/db/schema";

export function FactureActions({ facture }: { facture: Facture }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCreateLink() {
    setLoading("link");
    try {
      const { url } = await createPaymentLinkAction(facture.id);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Lien de paiement créé et copié dans le presse-papiers");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Échec de la création du lien");
    } finally {
      setLoading(null);
    }
  }

  async function handleMarkSent() {
    setLoading("sent");
    await markFactureSentAction(facture.id);
    setLoading(null);
    toast.success("Facture marquée comme envoyée");
    router.refresh();
  }

  async function handleMarkPaid() {
    if (!confirm("Confirmer que cette facture a été payée (hors ligne) ?")) return;
    setLoading("paid");
    await markFacturePaidAction(facture.id);
    setLoading(null);
    toast.success("Facture marquée comme payée");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
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
          <Button type="button" disabled={loading !== null} onClick={handleMarkPaid}>
            {loading === "paid" ? "..." : "Marquer comme payée"}
          </Button>
        </>
      )}
    </div>
  );
}
