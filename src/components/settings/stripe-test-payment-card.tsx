"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createTestPaymentAction } from "@/lib/actions/test-payment";

/** TEMPORAIRE — à retirer une fois le test de paiement live confirmé. */
export function StripeTestPaymentCard() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await createTestPaymentAction();
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    window.location.href = result.url;
  }

  return (
    <div className="rounded-lg border border-action/40 bg-action/10 px-4 py-3">
      <p className="text-sm font-medium text-action">🧪 Test — paiement réel de 0,50€</p>
      <p className="mt-0.5 text-xs text-muted">
        Vérifie juste que Stripe fonctionne en live. Va directement sur ton compte plateforme (pas Connect). À
        supprimer après le test.
      </p>
      <Button type="button" variant="outline" size="sm" className="mt-3" disabled={loading} onClick={handleClick}>
        {loading ? "Création..." : "Lancer le paiement test (0,50€)"}
      </Button>
    </div>
  );
}
