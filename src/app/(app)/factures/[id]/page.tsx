import { notFound } from "next/navigation";
import { Tampon, type TamponVariant } from "@/components/ui/tampon";
import { Card, CardContent } from "@/components/ui/card";
import { FactureActions } from "@/components/factures/facture-actions";
import { getFactureWithLignes } from "@/lib/actions/factures";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isEnRetard } from "@/lib/factures-utils";

export default async function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, current] = await Promise.all([getFactureWithLignes(id), getCurrentUser()]);
  if (!result) notFound();

  const { facture, client, lignes } = result;
  const enRetard = isEnRetard(facture);
  const statut: TamponVariant = enRetard ? "retard" : (facture.statut as TamponVariant);

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-black tracking-tight">{facture.numero}</h1>
        <Tampon variant={statut} />
      </div>

      <FactureActions facture={facture} canAcceptOnlinePayment={current?.profile?.stripeConnectChargesEnabled ?? false} />

      {facture.stripePaymentLinkUrl && facture.statut !== "payee" && (
        <p className="break-all rounded-xl border border-card-border bg-card p-3 text-xs text-muted">
          Lien de paiement : {facture.stripePaymentLinkUrl}
        </p>
      )}

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <p className="text-sm text-muted">Client</p>
            <p className="font-medium">{client.nom}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted">Émission</p>
              <p>{facture.dateEmission ?? "—"}</p>
            </div>
            <div>
              <p className="text-muted">Échéance</p>
              <p>{facture.dateEcheance ?? "—"}</p>
            </div>
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
              {Number(facture.montantTotal).toFixed(2)} €
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
