"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { markDevisSentAction } from "@/lib/actions/devis";

export function ShareDevisButton({ devisId }: { devisId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const result = await markDevisSentAction(devisId);
    setLoading(false);

    if (!result.success || !result.url) {
      toast.error(result.error ?? "Impossible de générer le lien");
      return;
    }
    await navigator.clipboard.writeText(result.url).catch(() => {});
    toast.success("Lien copié — envoie-le à ton client.");
    router.refresh();
  }

  return (
    <Button type="button" variant="outline" disabled={loading} onClick={handleClick}>
      {loading ? "..." : "Copier le lien pour le client"}
    </Button>
  );
}
