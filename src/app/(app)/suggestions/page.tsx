import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SuggestionForm } from "@/components/suggestions/suggestion-form";
import { listMySuggestionsAction } from "@/lib/actions/suggestions";
import type { VideoSuggestionStatus } from "@/lib/db/schema";

const STATUS_LABEL: Record<VideoSuggestionStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
};

const STATUS_VARIANT: Record<VideoSuggestionStatus, "outline" | "default" | "accent"> = {
  pending: "outline",
  approved: "default",
  rejected: "accent",
};

export default async function SuggestionsPage() {
  const suggestions = await listMySuggestionsAction();

  return (
    <div>
      <h1 className="font-display text-2xl font-black tracking-tight">Suggestions</h1>
      <p className="mt-1 text-sm text-muted">
        Propose une vidéo YouTube à ajouter au catalogue — elle sera vérifiée avant de rejoindre les découvertes de
        tout le monde.
      </p>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <SuggestionForm />
          <p className="mt-2 text-xs text-muted">5 suggestions par jour maximum.</p>
        </CardContent>
      </Card>

      <h2 className="mt-8 font-display text-lg font-black tracking-tight">Tes suggestions</h2>

      {suggestions.length === 0 ? (
        <Card className="mt-4">
          <CardContent className="pt-6 text-center text-sm text-muted">Tu n&apos;as encore rien proposé.</CardContent>
        </Card>
      ) : (
        <div className="mt-4 space-y-2">
          {suggestions.map((s) => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between gap-3 pt-6">
                <span className="truncate font-mono text-sm text-muted">{s.youtubeVideoId}</span>
                <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABEL[s.status]}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
