import { notFound } from "next/navigation";
import { DevisForm } from "@/components/devis/devis-form";
import { ConvertButton } from "@/components/devis/convert-button";
import { ShareDevisButton } from "@/components/devis/share-devis-button";
import { Tampon, type TamponVariant } from "@/components/ui/tampon";
import { Button } from "@/components/ui/button";
import { getDevisWithLignes } from "@/lib/actions/devis";
import { listClients } from "@/lib/actions/clients";

export default async function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, clients] = await Promise.all([getDevisWithLignes(id), listClients()]);
  if (!result) notFound();

  const { statut } = result.devis;

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-black tracking-tight">{result.devis.numero}</h1>
        <Tampon variant={statut as TamponVariant} />
        <div className="ml-auto flex flex-wrap gap-2">
          <a href={`/api/devis/${result.devis.id}/pdf`} target="_blank" rel="noopener noreferrer">
            <Button type="button" variant="outline">
              Télécharger le PDF
            </Button>
          </a>
          {(statut === "brouillon" || statut === "envoye") && <ShareDevisButton devisId={result.devis.id} />}
          {statut !== "accepte" && <ConvertButton devisId={result.devis.id} />}
        </div>
      </div>
      <div className="max-w-lg">
        <DevisForm clients={clients} devis={result.devis} initialLignes={result.lignes} />
      </div>
    </div>
  );
}
