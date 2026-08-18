"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, type PanInfo } from "framer-motion";
import { X, Heart, ExternalLink, ChevronDown, Star, Sparkles } from "lucide-react";
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
  // Incrémenté à chaque swipe — permet d'ignorer une mise à jour asynchrone
  // devenue obsolète (voir handleSwipe).
  const swipeGenerationRef = useRef(0);

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
    getFavoriteChannelIdsAction()
      .then((ids) => setFavoriteChannelIds(new Set(ids)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (result.status !== "ok") return;
    let cancelled = false;
    const videoId = result.video.id;
    getNextVideoAction(filters, videoId)
      .then((next) => {
        if (cancelled) return;
        prefetchedRef.current = { videoId, result: next };
        // Précharger la miniature aussi, pas seulement les données : sans ça
        // la carte suivante s'affiche avec un trou le temps que l'image
        // arrive, ce qui annule le bénéfice du préchargement.
        if (next.status === "ok") new window.Image().src = next.video.thumbnailUrl;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  async function handleSwipe(direction: "like" | "skip", reason?: SwipeReason) {
    if (result.status !== "ok" || loading) return;
    // Chaque swipe ouvre une "génération". Une resynchronisation tardive (voir
    // plus bas) peut se terminer alors que l'utilisateur a déjà swipé la carte
    // suivante : sans ce compteur, elle écraserait la carte affichée par une
    // autre — voire ferait réapparaître une vidéo déjà swipée, l'enregistrement
    // de celle-ci pouvant être encore en vol au moment de la requête.
    const generation = ++swipeGenerationRef.current;
    const videoId = result.video.id;
    const prefetched = prefetchedRef.current?.videoId === videoId ? prefetchedRef.current.result : null;
    prefetchedRef.current = null;
    setLoading(true);
    setFlyDirection(direction);
    setReasonMenuOpen(false);

    // L'enregistrement part immédiatement mais ne retient plus l'affichage
    // quand la vidéo suivante est déjà préchargée : c'est ce qui rendait le
    // swipe lent, l'écriture serveur pouvant prendre plusieurs centaines de
    // millisecondes. Le gestionnaire de rejet est attaché tout de suite pour
    // qu'une erreur ne remonte jamais en "unhandled rejection".
    const recorded = recordSwipeAction(videoId, direction, reason).then(
      () => null,
      (error: unknown) => (error instanceof Error ? error.message : "Ça n'a pas marché. Réessaie.")
    );

    try {
      // La carte s'envole pendant EXIT_ANIMATION_MS quoi qu'il arrive côté
      // réseau — évite que la prochaine vidéo n'apparaisse brutalement avant
      // que l'animation de sortie n'ait eu le temps de jouer.
      const [, next] = await Promise.all([
        wait(EXIT_ANIMATION_MS),
        prefetched ??
          recorded.then((error) => {
            if (error) throw new Error(error);
            return getNextVideoAction(filters);
          }),
      ]);
      setResult(next);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Ça n'a pas marché. Réessaie.");
    } finally {
      setLoading(false);
      setFlyDirection(null);
    }

    // Carte préchargée : l'enregistrement s'est fait en arrière-plan, donc son
    // échec (quota du jour atteint, par exemple) n'apparaît qu'ici. On resynchronise
    // alors sur l'état réel du serveur au lieu de laisser l'utilisateur sur une
    // carte qu'il ne pourra pas valider.
    if (prefetched) {
      const error = await recorded;
      if (error) {
        // L'erreur est signalée quoi qu'il arrive : le swipe a bien échoué.
        toast.error(error);
        // En revanche on ne touche à l'affichage que si l'utilisateur est
        // toujours sur cette génération. S'il a déjà swipé depuis, la
        // génération courante gère son propre état et écraser serait faux.
        if (swipeGenerationRef.current !== generation) return;
        try {
          const resynced = await getNextVideoAction(filters);
          // Revérifié après l'attente réseau : un swipe a pu survenir entre-temps.
          if (swipeGenerationRef.current === generation) setResult(resynced);
        } catch {
          // Rien à ajouter : le toast ci-dessus a déjà signalé le problème.
        }
      }
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
            {video.fromSuggestion && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/80 px-2 py-1 text-xs text-white">
                <Sparkles className="h-3 w-3" /> Suggéré par la communauté
              </span>
            )}
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
