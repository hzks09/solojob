"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { approveSuggestionAction, rejectSuggestionAction, type PendingSuggestion } from "@/lib/actions/suggestions";

export function SuggestionReviewCard({ suggestion }: { suggestion: PendingSuggestion }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      await approveSuggestionAction(suggestion.id);
      toast.success("Vidéo approuvée, elle rejoint le catalogue.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ça n'a pas marché.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    try {
      await rejectSuggestionAction(suggestion.id);
      toast.success("Suggestion refusée.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ça n'a pas marché.");
    } finally {
      setLoading(false);
    }
  }

  const thumbnail =
    suggestion.details?.snippet.thumbnails.medium?.url ?? suggestion.details?.snippet.thumbnails.default?.url;

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniature YouTube externe
          <img src={thumbnail} alt="" className="h-16 w-28 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="h-16 w-28 shrink-0 rounded-lg bg-card-border" />
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-medium">
            {suggestion.details?.snippet.title ?? "Vidéo introuvable"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {suggestion.details?.snippet.channelTitle ?? suggestion.youtubeVideoId}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleReject} aria-label="Refuser">
            <X className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="action"
            size="sm"
            disabled={loading || !suggestion.details}
            onClick={handleApprove}
            aria-label="Approuver"
          >
            <Check className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
