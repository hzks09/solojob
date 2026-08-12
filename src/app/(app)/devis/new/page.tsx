import { DevisForm } from "@/components/devis/devis-form";
import { listClients } from "@/lib/actions/clients";

export default async function NewDevisPage() {
  const clients = await listClients();

  return (
    <div>
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Nouveau devis</h1>
      <div className="max-w-lg">
        <DevisForm clients={clients} />
      </div>
    </div>
  );
}
