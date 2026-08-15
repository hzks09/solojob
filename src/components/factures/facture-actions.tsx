"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tampon } from "@/components/ui/tampon";
import { markFacturePaidAction, markFactureSentAction } from "@/lib/actions/facture-payment";
import type { Facture } from "@/lib/db/schema";

export function FactureActions({ facture, paypalMeUsername }: { facture: Facture; paypalMeUsername: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [showStamp, setShowStamp] = useState(false);

  async function handlePaypalLink() {
    if (!paypalMeUsername) return;
    setLoading("link");
    const url = `https://paypal.me/${paypalMeUsername}/${Number(facture.montantTotal).toFixed(2)}`;
    await navigator.clipboard.writeText(url).catch(() => {});
    if (facture.statut === "brouillon") {
      await markFactureSentAction(facture.id);
    }
    setLoading(null);
    toast.success("Lien PayPal copié.");
    router.refresh();
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
          {paypalMeUsername ? (
            <Button type="button" variant="outline" disabled={loading !== null} onClick={handlePaypalLink}>
              {loading === "link" ? "..." : "Copier le lien PayPal"}
            </Button>
          ) : (
            <Link
              href="/settings"
              className="flex items-center rounded-full border border-card-border px-3 py-1.5 text-xs text-muted hover:text-foreground"
            >
              Configurer un lien de paiement
            </Link>
          )}
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
