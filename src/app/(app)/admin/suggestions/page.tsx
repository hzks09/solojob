import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { SuggestionReviewCard } from "@/components/suggestions/suggestion-review-card";
import { getCurrentUser } from "@/lib/auth/current-user";
import { listPendingSuggestionsAction } from "@/lib/actions/suggestions";

export default async function AdminSuggestionsPage() {
  const current = await getCurrentUser();
  if (!current?.profile?.isAdmin) notFound();

  const pending = await listPendingSuggestionsAction();

  return (
    <div>
      <h1 className="font-display text-2xl font-black tracking-tight">Modération des suggestions</h1>
      <p className="mt-1 text-sm text-muted">{pending.length} vidéo(s) en attente</p>

      {pending.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="pt-6 text-center text-sm text-muted">Rien à modérer pour l&apos;instant.</CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {pending.map((s) => (
            <SuggestionReviewCard key={s.id} suggestion={s} />
          ))}
        </div>
      )}
    </div>
  );
}
