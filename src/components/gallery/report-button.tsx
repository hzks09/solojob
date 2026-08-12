"use client";

import { useState } from "react";
import { Flag } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reportGeneration } from "@/lib/actions/gallery";

export function ReportButton({ generationId }: { generationId: string }) {
  const { data: session } = useSession();
  const [sent, setSent] = useState(false);

  if (!session?.user || sent) {
    return (
      <Button variant="ghost" size="sm" disabled>
        <Flag className="h-3.5 w-3.5" /> {sent ? "Signalé" : "Signaler"}
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await reportGeneration(generationId, "Contenu inapproprié signalé par un utilisateur");
        setSent(true);
        toast.success("Merci, notre équipe va examiner ce contenu");
      }}
    >
      <Flag className="h-3.5 w-3.5" /> Signaler
    </Button>
  );
}
