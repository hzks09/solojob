import { notFound } from "next/navigation";
import { DevisForm } from "@/components/devis/devis-form";
import { ConvertButton } from "@/components/devis/convert-button";
import { getDevisWithLignes } from "@/lib/actions/devis";
import { listClients } from "@/lib/actions/clients";

export default async function DevisDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [result, clients] = await Promise.all([getDevisWithLignes(id), listClients()]);
  if (!result) notFound();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{result.devis.numero}</h1>
        {result.devis.statut !== "accepte" && <ConvertButton devisId={result.devis.id} />}
      </div>
      <div className="max-w-lg">
        <DevisForm clients={clients} devis={result.devis} initialLignes={result.lignes} />
      </div>
    </div>
  );
}
