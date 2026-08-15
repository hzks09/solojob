"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updatePaypalMeUsernameAction } from "@/lib/actions/profile";

export function PaypalLinkCard({ initialUsername }: { initialUsername: string | null }) {
  const [username, setUsername] = useState(initialUsername ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await updatePaypalMeUsernameAction(username);
    setSaving(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Lien de paiement mis à jour");
  }

  return (
    <form onSubmit={handleSave} className="rounded-lg border border-card-border p-4">
      <p className="text-sm font-medium">Encaisser en ligne (en attendant Stripe Connect)</p>
      <p className="mt-1 text-xs text-muted">
        Renseigne ton pseudo PayPal.me : tes factures auront un lien de paiement avec le bon montant, versé
        directement sur ton compte PayPal — SoloJob ne touche jamais l&apos;argent.
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="whitespace-nowrap text-sm text-muted">paypal.me/</span>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="tonpseudo"
          className="flex-1"
        />
      </div>
      <Button type="submit" variant="outline" size="sm" className="mt-3" disabled={saving}>
        {saving ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
