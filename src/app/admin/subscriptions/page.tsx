import { Badge } from "@/components/ui/badge";
import { listSubscriptions } from "@/lib/actions/admin";

export default async function AdminSubscriptionsPage() {
  const rows = await listSubscriptions();

  return (
    <div className="overflow-x-auto rounded-2xl border border-card-border">
      <table className="w-full text-sm">
        <thead className="bg-card text-left text-xs uppercase text-muted">
          <tr>
            <th className="px-4 py-3">Utilisateur</th>
            <th className="px-4 py-3">Forfait</th>
            <th className="px-4 py-3">Statut</th>
            <th className="px-4 py-3">Période en cours</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ subscription, user }) => (
            <tr key={subscription.id} className="border-t border-card-border">
              <td className="px-4 py-3">
                <p className="font-medium">{user.name ?? "—"}</p>
                <p className="text-xs text-muted">{user.email}</p>
              </td>
              <td className="px-4 py-3 capitalize">{subscription.plan}</td>
              <td className="px-4 py-3">
                <Badge variant={subscription.status === "active" ? "accent" : "outline"}>
                  {subscription.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted">
                {subscription.currentPeriodEnd
                  ? new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR")
                  : "—"}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                Aucun abonnement pour l&apos;instant
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
