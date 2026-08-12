import { notFound } from "next/navigation";
import { DevisForm } from "@/components/devis/devis-form";
import { ConvertButton } from "@/components/devis/convert-button";
import { Tampon, type TamponVariant } from "@/components/ui/tampon";
import { getDevisWithLignes } from "@/lib/actions/devis";
import { listClients } from "@/lib/actions/clients";

export default async function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, clients] = await Promise.all([getDevisWithLignes(id), listClients()]);
  if (!result) notFound();

  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <h1 className="font-display text-2xl font-black tracking-tight">{result.devis.numero}</h1>
        <Tampon variant={result.devis.statut as TamponVariant} />
        <div className="ml-auto">{result.devis.statut !== "accepte" && <ConvertButton devisId={result.devis.id} />}</div>
      </div>
      <div className="max-w-lg">
        <DevisForm clients={clients} devis={result.devis} initialLignes={result.lignes} />
      </div>
    </div>
  );
}
