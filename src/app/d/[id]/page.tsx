import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/logo";
import { Tampon, type TamponVariant } from "@/components/ui/tampon";
import { Card, CardContent } from "@/components/ui/card";
import { DevisPublicActions } from "@/components/devis/devis-public-actions";
import { getPublicDevis } from "@/lib/actions/devis-public";

export default async function PublicDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await getPublicDevis(id);
  if (!result) notFound();

  const { devis, client, artisan, lignes } = result;
  const artisanNom = artisan.companyName || artisan.fullName || "ton artisan";

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center justify-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="font-display text-sm font-black tracking-tight text-muted">SoloJob</span>
        </div>

        <div className="text-center">
          <p className="text-sm text-muted">Devis de {artisanNom}</p>
          <h1 className="mt-1 font-display text-2xl font-black tracking-tight">{devis.numero}</h1>
          <div className="mt-3 flex justify-center">
            <Tampon variant={devis.statut as TamponVariant} />
          </div>
        </div>

        <Card>
          <CardContent className="space-y-4 pt-6">
            <div>
              <p className="text-sm text-muted">Pour</p>
              <p className="font-medium">{client.nom}</p>
            </div>

            <div className="space-y-2 border-t border-card-border pt-4">
              {lignes.map((l) => (
                <div key={l.id} className="flex justify-between text-sm">
                  <span>
                    {l.description} ({l.quantite} × {Number(l.prixUnitaire).toFixed(2)}€)
                  </span>
                  <span className="font-mono">{(Number(l.quantite) * Number(l.prixUnitaire)).toFixed(2)} €</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between border-t border-card-border pt-4">
              <span className="text-sm text-muted">Total</span>
              <span className="font-mono text-2xl font-semibold text-action">
                {Number(devis.montantTotal).toFixed(2)} €
              </span>
            </div>

            {devis.dateValidite && (
              <p className="text-center text-xs text-muted">Valable jusqu&apos;au {devis.dateValidite}</p>
            )}
          </CardContent>
        </Card>

        <DevisPublicActions devisId={devis.id} statut={devis.statut} />
      </div>
    </main>
  );
}
