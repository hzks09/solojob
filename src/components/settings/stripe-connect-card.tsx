"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { startStripeConnectOnboardingAction, syncStripeConnectStatusAction } from "@/lib/actions/stripe-connect";

export function StripeConnectCard({
  hasAccount: initialHasAccount,
  chargesEnabled: initialChargesEnabled,
}: {
  hasAccount: boolean;
  chargesEnabled: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [hasAccount, setHasAccount] = useState(initialHasAccount);
  const [chargesEnabled, setChargesEnabled] = useState(initialChargesEnabled);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const status = searchParams.get("stripe_connect");
    if (!status) return;

    router.replace("/settings");

    if (status === "return") {
      syncStripeConnectStatusAction().then((result) => {
        setHasAccount(true);
        setChargesEnabled(result.chargesEnabled);
        toast.success(
          result.chargesEnabled ? "Compte Stripe connecté, tu peux encaisser en ligne." : "Onboarding en cours — reviens quand c'est terminé."
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleConnect() {
    setLoading(true);
    try {
      const { url } = await startStripeConnectOnboardingAction();
      window.location.href = url;
    } catch (err) {
      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Impossible de démarrer la connexion Stripe");
    }
  }

  if (chargesEnabled) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-accent/40 bg-accent/10 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-accent">Compte Stripe connecté</p>
          <p className="mt-0.5 text-xs text-muted">Les paiements de tes factures arrivent directement sur ton compte.</p>
        </div>
        <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleConnect}>
          Gérer
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-action/40 bg-action/10 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-action">
          {hasAccount ? "Connexion Stripe incomplète" : "Compte Stripe non connecté"}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          Nécessaire pour encaisser en ligne — sans ça tu ne peux pas envoyer de lien de paiement.
        </p>
      </div>
      <Button type="button" variant="action" size="sm" disabled={loading} onClick={handleConnect}>
        {loading ? "Redirection..." : hasAccount ? "Reprendre" : "Connecter mon compte"}
      </Button>
    </div>
  );
}
