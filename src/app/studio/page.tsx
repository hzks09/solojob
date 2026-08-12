import { StudioForm } from "@/components/studio/studio-form";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ style?: string }>;
}) {
  const { style } = await searchParams;

  return (
    <div className="min-h-screen">
      <DashboardNav />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">Studio de génération</h1>
        <p className="mt-1 text-sm text-muted">
          Choisis ta pièce, ton style, et laisse l&apos;IA transformer ton intérieur.
        </p>
        <div className="mt-8">
          <StudioForm initialStyle={style} />
        </div>
      </main>
    </div>
  );
}
