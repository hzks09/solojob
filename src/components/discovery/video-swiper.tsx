"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Heart, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNextVideoAction, recordSwipeAction, type NextVideoResult } from "@/lib/actions/discovery";
import { formatDuration } from "@/lib/utils";

export function VideoSwiper({ initialResult }: { initialResult: NextVideoResult }) {
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);

  async function handleSwipe(direction: "like" | "skip") {
    if (result.status !== "ok" || loading) return;
    setLoading(true);
    try {
      await recordSwipeAction(result.video.id, direction);
      const next = await getNextVideoAction();
      setResult(next);
    } catch {
      toast.error("Ça n'a pas marché. Réessaie.");
    } finally {
      setLoading(false);
    }
  }

  if (result.status === "empty") {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6 text-center text-sm text-muted">
          Pas encore de vidéos disponibles — reviens un peu plus tard, le pool se remplit automatiquement.
        </CardContent>
      </Card>
    );
  }

  if (result.status === "limit_reached") {
    return (
      <Card className="mt-8 border-2 border-action">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted">Tu as atteint ta limite de découvertes pour aujourd&apos;hui.</p>
          <Link href="/billing" className="mt-3 inline-block text-sm font-medium text-action hover:underline">
            Passe à NextWatch+ pour des découvertes illimitées →
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (result.status === "unauthenticated") {
    return null;
  }

  const { video, remainingToday } = result;

  return (
    <div className="mt-4">
      {remainingToday !== null && (
        <p className="mb-3 text-center text-xs text-muted">{remainingToday} découverte(s) restante(s) aujourd&apos;hui</p>
      )}

      <Card className="overflow-hidden">
        <div className="relative aspect-video w-full bg-card-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- miniature YouTube externe, pas d'optimisation next/image nécessaire */}
          <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" />
          <span className="absolute bottom-2 right-2 rounded bg-black/80 px-1.5 py-0.5 font-mono text-xs text-white">
            {formatDuration(video.durationSeconds)}
          </span>
        </div>
        <CardContent className="pt-4">
          <p className="line-clamp-2 font-medium">{video.title}</p>
          <p className="mt-1 text-sm text-muted">{video.channelTitle}</p>
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:underline"
          >
            Regarder sur YouTube <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardContent>
      </Card>

      <div className="mt-4 flex items-center justify-center gap-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          disabled={loading}
          onClick={() => handleSwipe("skip")}
        >
          <X className="h-5 w-5" /> Passer
        </Button>
        <Button
          type="button"
          variant="action"
          size="lg"
          className="flex-1"
          disabled={loading}
          onClick={() => handleSwipe("like")}
        >
          <Heart className="h-5 w-5" /> Garder
        </Button>
      </div>
    </div>
  );
}
