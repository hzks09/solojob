import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { GenerationCard } from "@/components/history/generation-card";
import { listHistory } from "@/lib/actions/generations";

export default async function HistoryPage() {
  const generations = await listHistory();

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Historique</h1>
        <p className="mt-1 text-sm text-muted">{generations.length} génération(s)</p>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {generations.map((g) => (
            <GenerationCard key={g.id} generation={g} />
          ))}
        </div>
      </main>
    </div>
  );
}
