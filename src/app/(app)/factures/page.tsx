import { FacturesList } from "@/components/factures/factures-list";
import { LegalInfoWarning } from "@/components/factures/legal-info-warning";
import { listFactures } from "@/lib/actions/factures";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function FacturesPage() {
  const [rows, current] = await Promise.all([listFactures(), getCurrentUser()]);
  const legalInfoMissing = !current?.profile?.siret || !current?.profile?.adresse;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-black tracking-tight">Factures</h1>
        <p className="mt-1 text-sm text-muted">{rows.length} facture(s)</p>
      </div>
      {legalInfoMissing && (
        <div className="mb-6">
          <LegalInfoWarning />
        </div>
      )}
      <FacturesList rows={rows} />
    </div>
  );
}
