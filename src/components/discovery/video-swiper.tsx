"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, type PanInfo } from "framer-motion";
import { X, Heart, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getNextVideoAction, recordSwipeAction, type NextVideoResult } from "@/lib/actions/discovery";
import { formatDuration } from "@/lib/utils";

const SWIPE_DISTANCE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;
const EXIT_ANIMATION_MS = 220;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function VideoSwiper({ initialResult }: { initialResult: NextVideoResult }) {
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [flyDirection, setFlyDirection] = useState<"like" | "skip" | null>(null);

  async function handleSwipe(direction: "like" | "skip") {
    if (result.status !== "ok" || loading) return;
    const videoId = result.video.id;
    setLoading(true);
    setFlyDirection(direction);

    try {
      // La carte s'envole pendant EXIT_ANIMATION_MS quoi qu'il arrive côté
      // réseau — évite que la prochaine vidéo n'apparaisse brutalement avant
      // que l'animation de sortie n'ait eu le temps de jouer.
      const [, next] = await Promise.all([
        wait(EXIT_ANIMATION_MS),
        recordSwipeAction(videoId, direction).then(() => getNextVideoAction()),
      ]);
      setResult(next);
    } catch {
      toast.error("Ça n'a pas marché. Réessaie.");
    } finally {
      setLoading(false);
      setFlyDirection(null);
    }
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_DISTANCE_THRESHOLD || info.velocity.x > SWIPE_VELOCITY_THRESHOLD) {
      handleSwipe("like");
    } else if (info.offset.x < -SWIPE_DISTANCE_THRESHOLD || info.velocity.x < -SWIPE_VELOCITY_THRESHOLD) {
      handleSwipe("skip");
    }
  }

  // Raccourcis clavier desktop — même geste que les boutons.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowRight") handleSwipe("like");
      else if (e.key === "ArrowLeft") handleSwipe("skip");
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result, loading]);

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

  if (result.status === "rate_limited") {
    return (
      <Card className="mt-8">
        <CardContent className="pt-6 text-center text-sm text-muted">
          Doucement ! Attends quelques secondes avant de continuer.
        </CardContent>
      </Card>
    );
  }

  const { video, remainingToday } = result;

  return (
    <div className="mt-4">
      {remainingToday !== null && (
        <p className="mb-3 text-center text-xs text-muted">{remainingToday} découverte(s) restante(s) aujourd&apos;hui</p>
      )}

      <motion.div
        key={video.id}
        drag={loading ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDragEnd={handleDragEnd}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={
          flyDirection
            ? { x: flyDirection === "like" ? 400 : -400, opacity: 0, rotate: flyDirection === "like" ? 18 : -18 }
            : { x: 0, opacity: 1, scale: 1, rotate: 0 }
        }
        transition={
          flyDirection
            ? { duration: EXIT_ANIMATION_MS / 1000, ease: "easeIn" }
            : { type: "spring", stiffness: 300, damping: 28 }
        }
        className="touch-pan-y cursor-grab select-none active:cursor-grabbing"
      >
        <Card className="overflow-hidden">
          <div className="relative aspect-video w-full bg-card-border">
            {/* eslint-disable-next-line @next/next/no-img-element -- miniature YouTube externe, pas d'optimisation next/image nécessaire */}
            <img src={video.thumbnailUrl} alt={video.title} className="h-full w-full object-cover" draggable={false} />
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
      </motion.div>

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
