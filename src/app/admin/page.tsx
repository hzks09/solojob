import { Card, CardContent } from "@/components/ui/card";
import { getAdminStats } from "@/lib/actions/admin";

export default async function AdminStatsPage() {
  const stats = await getAdminStats();

  const cards = [
    { label: "Utilisateurs", value: stats.userCount },
    { label: "Générations totales", value: stats.generationCount },
    { label: "Designs publics", value: stats.publicCount },
    { label: "Abonnés payants", value: stats.paidCount },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="pt-6">
            <p className="text-sm text-muted">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
