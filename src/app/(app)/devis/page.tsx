import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listDevis } from "@/lib/actions/devis";

const STATUT_LABELS: Record<string, string> = {
  brouillon: "Brouillon",
  envoye: "Envoyé",
  accepte: "Accepté",
  refuse: "Refusé",
};

export default async function DevisPage() {
  const rows = await listDevis();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Devis</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} devis</p>
        </div>
        <Link href="/devis/new" className={buttonVariants()}>
          Nouveau devis
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted">Aucun devis pour l&apos;instant.</CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map(({ devis, clientNom }) => (
            <Link key={devis.id} href={`/devis/${devis.id}`}>
              <Card className="transition-colors hover:border-brand">
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="font-medium">
                      {devis.numero} — {clientNom}
                    </p>
                    <p className="text-sm text-muted">{Number(devis.montantTotal).toFixed(2)} €</p>
                  </div>
                  <Badge variant={devis.statut === "accepte" ? "accent" : "outline"}>
                    {STATUT_LABELS[devis.statut]}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
