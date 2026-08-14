import { FacturesList } from "@/components/factures/factures-list";
import { listFactures } from "@/lib/actions/factures";

export default async function FacturesPage() {
  const rows = await listFactures();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-black tracking-tight">Factures</h1>
        <p className="mt-1 text-sm text-muted">{rows.length} facture(s)</p>
      </div>
      <FacturesList rows={rows} />
    </div>
  );
}
