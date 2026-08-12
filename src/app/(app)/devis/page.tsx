import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Tampon, type TamponVariant } from "@/components/ui/tampon";
import { Card, CardContent } from "@/components/ui/card";
import { listDevis } from "@/lib/actions/devis";

export default async function DevisPage() {
  const rows = await listDevis();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-black tracking-tight">Devis</h1>
          <p className="mt-1 text-sm text-muted">{rows.length} devis</p>
        </div>
        <Link href="/devis/new" className={buttonVariants({ variant: "action" })}>
          Nouveau devis
        </Link>
      </div>

      {rows.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted">
            Pas encore de devis. Le premier prend 60 secondes.
          </CardContent>
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
                    <p className="font-mono text-sm text-muted">{Number(devis.montantTotal).toFixed(2)} €</p>
                  </div>
                  <Tampon variant={devis.statut as TamponVariant} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
