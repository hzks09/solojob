"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { convertDevisToFactureAction } from "@/lib/actions/devis";

export function ConvertButton({ devisId }: { devisId: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await convertDevisToFactureAction(devisId);
    } catch (err) {
      // Next.js signale une redirection depuis une server action via une exception
      // portant un `digest` préfixé "NEXT_REDIRECT" — à laisser remonter telle quelle.
      const digest = (err as { digest?: string } | null)?.digest;
      if (typeof digest === "string" && digest.startsWith("NEXT_REDIRECT")) throw err;

      setLoading(false);
      toast.error(err instanceof Error ? err.message : "Ça n'a pas marché. Réessaie.");
    }
  }

  return (
    <Button variant="action" onClick={handleClick} disabled={loading}>
      {loading ? "Conversion..." : "Convertir en facture"}
    </Button>
  );
}
