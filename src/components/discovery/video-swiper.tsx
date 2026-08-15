"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, type PanInfo } from "framer-motion";
import { X, Heart, ExternalLink, ChevronDown, Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getNextVideoAction,
  recordSwipeAction,
  type DiscoveryFilters,
  type NextVideoResult,
} from "@/lib/actions/discovery";
import { getFavoriteChannelIdsAction, toggleFavoriteChannelAction } from "@/lib/actions/channels";
import type { SwipeReason } from "@/lib/db/schema";
import { cn, formatDuration } from "@/lib/utils";
import { FilterPanel } from "./filter-panel";

const SWIPE_DISTANCE_THRESHOLD = 120;
const SWIPE_VELOCITY_THRESHOLD = 500;
const EXIT_ANIMATION_MS = 220;

const SKIP_REASONS: { value: SwipeReason; label: string }[] = [
  { value: "already_seen", label: "Déjà vu" },
  { value: "not_my_style", label: "Pas mon style" },
  { value: "boring_channel", label: "Chaîne pas intéressante" },
];

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function VideoSwiper({
  initialResult,
  advancedFiltersAllowed,
}: {
  initialResult: NextVideoResult;
  advancedFiltersAllowed: boolean;
}) {
  const [result, setResult] = useState(initialResult);
  const [filters, setFilters] = useState<DiscoveryFilters>({});
  const [loading, setLoading] = useState(false);
  const [flyDirection, setFlyDirection] = useState<"like" | "skip" | null>(null);
  const [reasonMenuOpen, setReasonMenuOpen] = useState(false);
  const [favoriteChannelIds, setFavoriteChannelIds] = useState<Set<string>>(new Set());
  // `initialResult` vient déjà du serveur sans filtre — on ne veut pas
  // relancer un fetch identique juste après le premier rendu.
  const isFirstRender = useRef(true);
  // Vidéo suivante préchargée en arrière-plan dès que la vidéo actuelle
  // s'affiche, pour éviter tout temps d'attente perçu après un swipe.
  const prefetchedRef = useRef<{ videoId: string; result: NextVideoResult } | null>(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setLoading(true);
    getNextVideoAction(filters)
      .then(setResult)
      .catch(() => toast.error("Ça n'a pas marché. Réessaie."))
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    getFavoriteChannelIdsAction().then((ids) => setFavoriteChannelIds(new Set(ids)));
  }, []);

  useEffect(() => {
    if (result.status !== "ok") return;
    let cancelled = false;
    const videoId = result.video.id;
    getNextVideoAction(filters, videoId).then((next) => {
      if (!cancelled) prefetchedRef.current = { videoId, result: next };
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  async function handleSwipe(direction: "like" | "skip", reason?: SwipeReason) {
    if (result.status !== "ok" || loading) return;
    const videoId = result.video.id;
    const prefetched = prefetchedRef.current?.videoId === videoId ? prefetchedRef.current.result : null;
    prefetchedRef.current = null;
    setLoading(true);
    setFlyDirection(direction);
    setReasonMenuOpen(false);

    try {
      // La carte s'envole pendant EXIT_ANIMATION_MS quoi qu'il arrive côté
      // réseau — évite que la prochaine vidéo n'apparaisse brutalement avant
      // que l'animation de sortie n'ait eu le temps de jouer. La vidéo
      // suivante est déjà préchargée la plupart du temps, donc il ne reste
      // souvent que l'enregistrement du swipe à attendre.
      const [, next] = await Promise.all([
        wait(EXIT_ANIMATION_MS),
        recordSwipeAction(videoId, direction, reason).then(() => prefetched ?? getNextVideoAction(filters)),
      ]);
      setResult(next);
    } catch {
      toast.error("Ça n'a pas marché. Réessaie.");
    } finally {
      setLoading(false);
      setFlyDirection(null);
    }
  }

  async function handleToggleFavoriteChannel(channelId: string, channelTitle: string) {
    // Optimiste : le retour serveur confirme juste ce qu'on affiche déjà.
    setFavoriteChannelIds((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) next.delete(channelId);
      else next.add(channelId);
      return next;
    });

    try {
      await toggleFavoriteChannelAction(channelId, channelTitle);
    } catch {
      toast.error("Ça n'a pas marché. Réessaie.");
      setFavoriteChannelIds((prev) => {
        const next = new Set(prev);
        if (next.has(channelId)) next.delete(channelId);
        else next.add(channelId);
        return next;
      });
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

  const filterPanel = (
    <FilterPanel filters={filters} onChange={setFilters} advancedFiltersAllowed={advancedFiltersAllowed} />
  );

  if (result.status === "unauthenticated") {
    return null;
  }

  if (result.status === "empty") {
    return (
      <div className="mt-4">
        {filterPanel}
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted">
            Aucune vidéo ne correspond à ces filtres pour l&apos;instant — élargis-les ou reviens plus tard.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result.status === "limit_reached") {
    return (
      <div className="mt-4">
        {filterPanel}
        <Card className="border-2 border-action">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted">Tu as atteint ta limite de découvertes pour aujourd&apos;hui.</p>
            <Link href="/billing" className="mt-3 inline-block text-sm font-medium text-action hover:underline">
              Passe à Loupick+ pour des découvertes illimitées →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result.status === "rate_limited") {
    return (
      <div className="mt-4">
        {filterPanel}
        <Card>
          <CardContent className="pt-6 text-center text-sm text-muted">
            Doucement ! Attends quelques secondes avant de continuer.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (result.status === "filters_require_upgrade") {
    return (
      <div className="mt-4">
        {filterPanel}
        <Card className="border-2 border-action">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted">Ce filtre est réservé à Loupick+.</p>
            <Link href="/billing" className="mt-3 inline-block text-sm font-medium text-action hover:underline">
              Passe à Loupick+ →
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { video, remainingToday } = result;

  return (
    <div className="mt-4">
      {filterPanel}

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
            <div className="mt-1 flex items-center gap-1.5">
              <p className="text-sm text-muted">{video.channelTitle}</p>
              {video.channelId && (
                <button
                  type="button"
                  onClick={() => handleToggleFavoriteChannel(video.channelId!, video.channelTitle)}
                  aria-label={
                    favoriteChannelIds.has(video.channelId)
                      ? "Retirer cette chaîne des favoris"
                      : "Ajouter cette chaîne aux favoris"
                  }
                  className="text-muted transition-colors hover:text-action"
                >
                  <Star
                    className={cn(
                      "h-4 w-4",
                      favoriteChannelIds.has(video.channelId) && "fill-action text-action"
                    )}
                  />
                </button>
              )}
            </div>
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
        <div className="relative flex-1">
          {reasonMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setReasonMenuOpen(false)} />
              <div className="absolute bottom-full left-0 z-20 mb-2 w-full min-w-[220px] rounded-xl border border-card-border bg-card p-1.5 shadow-lg">
                <p className="px-3 py-1.5 text-xs text-muted">Pourquoi tu passes ?</p>
                {SKIP_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-card-border hover:text-foreground"
                    onClick={() => handleSwipe("skip", r.value)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="flex-1 rounded-r-none"
              disabled={loading}
              onClick={() => handleSwipe("skip")}
            >
              <X className="h-5 w-5" /> Passer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="rounded-l-none border-l-0 px-3"
              disabled={loading}
              onClick={() => setReasonMenuOpen((v) => !v)}
              aria-label="Préciser pourquoi tu passes"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>
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
