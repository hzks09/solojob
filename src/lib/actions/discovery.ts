"use server";

import { and, arrayOverlaps, eq, gt, gte, inArray, lt, lte, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  videos,
  swipes,
  userTagWeights,
  savedVideos,
  favoriteChannels,
  type Video,
  type SwipeReason,
} from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PLANS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

export type DurationBucket = "short" | "medium" | "long";

export interface DiscoveryFilters {
  /** Filtre avancé (forfait payant) : < 4 min / 4-20 min / > 20 min. */
  durationBucket?: DurationBucket;
  /** Filtre avancé (forfait payant), basé sur `videos.language`. */
  language?: string;
  /** Mood(s)/sous-catégorie(s) — disponible pour tous les forfaits. */
  tags?: string[];
  /** N'afficher que les vidéos des chaînes marquées favorites — disponible pour tous les forfaits. */
  favoriteChannelsOnly?: boolean;
}

// Combien de vidéos les mieux notées entrent dans le tirage final — évite de
// toujours proposer strictement la mieux notée, laisse un peu de diversité.
const CANDIDATE_POOL_SIZE = 30;
const CANDIDATE_FETCH_LIMIT = 200;
const LIKE_WEIGHT_DELTA = 1;
const SKIP_WEIGHT_DELTA = -0.5;
// Skip avec motif renseigné = signal beaucoup plus fiable qu'un skip silencieux.
const SKIP_WITH_REASON_WEIGHT_DELTA = -1.5;
// Bonus de score pour une vidéo dont la chaîne a été marquée favorite —
// comparable en grandeur au poids initial d'un tag choisi à l'onboarding
// (voir INITIAL_WEIGHT dans onboarding.ts), pour rester significatif sans
// écraser complètement le score appris par tag.
const FAVORITE_CHANNEL_SCORE_BONUS = 3;
// Part des propositions qui ignorent complètement le score appris pour
// piocher parmi les tags les moins explorés — sans ça, le score appris ne
// fait que renforcer les tags choisis à l'onboarding et l'utilisateur ne
// découvre jamais de nouvelles catégories. Plus élevée pour un nouveau
// compte (peu de signal appris, donc plus de découverte), puis se resserre
// linéairement jusqu'au seuil ci-dessous une fois le goût mieux cerné.
const EXPLORATION_RATE_NEW = 0.3;
const EXPLORATION_RATE_ESTABLISHED = 0.12;
const EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES = 50;

function explorationRateFor(totalSwipes: number): number {
  if (totalSwipes >= EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES) return EXPLORATION_RATE_ESTABLISHED;
  const progress = totalSwipes / EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES;
  return EXPLORATION_RATE_NEW + (EXPLORATION_RATE_ESTABLISHED - EXPLORATION_RATE_NEW) * progress;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Découvertes déjà servies aujourd'hui pour le forfait Gratuit — compte les
 * swipes existants sur une fenêtre temporelle plutôt que de maintenir un
 * compteur dédié. `null` = forfait illimité, rien à vérifier.
 */
export async function getDailyDiscoveryUsage(): Promise<{ used: number; limit: number } | null> {
  const current = await getCurrentUser();
  if (!current) return null;

  const plan = current.profile?.plan ?? "free";
  const planConfig = PLANS[plan];
  if (planConfig.dailyDiscoveryLimit === "illimite") return null;

  const [{ value: used }] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(swipes)
    .where(and(eq(swipes.userId, current.authUser.id), sql`${swipes.createdAt} >= ${startOfToday()}`));

  return { used, limit: planConfig.dailyDiscoveryLimit };
}

export type NextVideoResult =
  | { status: "ok"; video: Video; remainingToday: number | null }
  | { status: "limit_reached" }
  | { status: "empty" }
  | { status: "unauthenticated" }
  | { status: "rate_limited" }
  | { status: "filters_require_upgrade" };

/**
 * Pioche la prochaine vidéo à proposer, jamais d'appel à l'API YouTube ici.
 * `excludeVideoId` sert au préchargement en arrière-plan : la vidéo affichée
 * à l'écran n'a pas encore été swipée (donc pas encore dans l'historique) et
 * ne doit pas être proposée une seconde fois par le préchargement.
 */
export async function getNextVideoAction(filters?: DiscoveryFilters, excludeVideoId?: string): Promise<NextVideoResult> {
  const current = await getCurrentUser();
  if (!current) return { status: "unauthenticated" };
  const userId = current.authUser.id;

  // Anti-bourrinage : rien n'empêchait un script d'appeler cette action en
  // boucle en dehors du rythme normal d'un swipe.
  if (!rateLimit(`discovery-next:${userId}`, 60, 60_000).success) {
    return { status: "rate_limited" };
  }

  // Durée/langue sont réservés au forfait payant — mood/sous-catégorie
  // restent disponibles pour tout le monde. Message explicite plutôt qu'un
  // blocage silencieux si un compte Gratuit tente d'y accéder.
  const planConfig = PLANS[current.profile?.plan ?? "free"];
  if (!planConfig.advancedFilters && (filters?.durationBucket || filters?.language)) {
    return { status: "filters_require_upgrade" };
  }

  const usage = await getDailyDiscoveryUsage();
  if (usage && usage.used >= usage.limit) {
    return { status: "limit_reached" };
  }

  const swipedRows = await db
    .select({ videoId: swipes.videoId, tags: videos.tags })
    .from(swipes)
    .innerJoin(videos, eq(swipes.videoId, videos.id))
    .where(eq(swipes.userId, userId));
  const swipedIds = swipedRows.map((s) => s.videoId);
  const excludeIds = excludeVideoId ? [...swipedIds, excludeVideoId] : swipedIds;

  const favoriteChannelRows = await db
    .select({ channelId: favoriteChannels.channelId })
    .from(favoriteChannels)
    .where(eq(favoriteChannels.userId, userId));
  const favoriteChannelIds = favoriteChannelRows.map((f) => f.channelId);

  // Pas de chaîne favorite : rien à proposer plutôt qu'un `inArray` vide
  // (qui ne matcherait jamais rien de toute façon, mais évite l'ambiguïté).
  if (filters?.favoriteChannelsOnly && favoriteChannelIds.length === 0) {
    return { status: "empty" };
  }

  const conditions = [];
  if (excludeIds.length) conditions.push(notInArray(videos.id, excludeIds));
  if (filters?.durationBucket === "short") conditions.push(lt(videos.durationSeconds, 240));
  else if (filters?.durationBucket === "medium") {
    conditions.push(and(gte(videos.durationSeconds, 240), lte(videos.durationSeconds, 1200)));
  } else if (filters?.durationBucket === "long") conditions.push(gt(videos.durationSeconds, 1200));
  if (filters?.language) conditions.push(eq(videos.language, filters.language));
  if (filters?.tags?.length) conditions.push(arrayOverlaps(videos.tags, filters.tags));
  if (filters?.favoriteChannelsOnly) conditions.push(inArray(videos.channelId, favoriteChannelIds));

  const pool = await db
    .select()
    .from(videos)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(CANDIDATE_FETCH_LIMIT);

  if (pool.length === 0) return { status: "empty" };

  // Exploration epsilon-greedy : une partie des propositions ignore le score
  // appris et pioche au hasard parmi les tags les moins swipés jusqu'ici.
  if (Math.random() < explorationRateFor(swipedRows.length)) {
    const tagSwipeCounts = new Map<string, number>();
    for (const row of swipedRows) {
      for (const tag of row.tags) tagSwipeCounts.set(tag, (tagSwipeCounts.get(tag) ?? 0) + 1);
    }
    const poolTags = Array.from(new Set(pool.flatMap((v) => v.tags)));
    const sortedByLeastExplored = poolTags.sort(
      (a, b) => (tagSwipeCounts.get(a) ?? 0) - (tagSwipeCounts.get(b) ?? 0)
    );
    const underexploredTags = new Set(sortedByLeastExplored.slice(0, Math.max(1, Math.ceil(poolTags.length / 2))));
    const explorationCandidates = pool.filter((v) => v.tags.some((t) => underexploredTags.has(t)));

    if (explorationCandidates.length > 0) {
      const chosen = explorationCandidates[Math.floor(Math.random() * explorationCandidates.length)];
      return {
        status: "ok",
        video: chosen,
        remainingToday: usage ? usage.limit - usage.used - 1 : null,
      };
    }
  }

  const weights = await db.select().from(userTagWeights).where(eq(userTagWeights.userId, userId));
  const weightByTag = new Map(weights.map((w) => [w.tag, Number(w.weight)]));
  const favoriteChannelIdSet = new Set(favoriteChannelIds);

  // Score = somme des poids appris pour les tags de la vidéo + bonus chaîne
  // favorite + un peu d'aléatoire, pour éviter de boucler sur les mêmes
  // catégories.
  const scored = pool
    .map((video) => ({
      video,
      score:
        video.tags.reduce((sum, tag) => sum + (weightByTag.get(tag) ?? 0), 0) +
        (video.channelId && favoriteChannelIdSet.has(video.channelId) ? FAVORITE_CHANNEL_SCORE_BONUS : 0) +
        Math.random() * 2,
    }))
    .sort((a, b) => b.score - a.score);

  const topCandidates = scored.slice(0, CANDIDATE_POOL_SIZE);
  const chosen = topCandidates[Math.floor(Math.random() * topCandidates.length)].video;

  return {
    status: "ok",
    video: chosen,
    remainingToday: usage ? usage.limit - usage.used - 1 : null,
  };
}

export async function recordSwipeAction(
  videoId: string,
  direction: "like" | "skip",
  reason?: SwipeReason
): Promise<{ success: boolean }> {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");
  const userId = current.authUser.id;

  // Anti-bourrinage — même limite que getNextVideoAction.
  if (!rateLimit(`discovery-swipe:${userId}`, 60, 60_000).success) {
    throw new Error("Trop de swipes trop vite, ralentis un peu.");
  }

  // Revérifié ici : cette action est appelable indépendamment de
  // getNextVideoAction, l'enforcement du quota ne doit jamais reposer sur le
  // fait que le client appelle les deux actions dans le bon ordre.
  const usage = await getDailyDiscoveryUsage();
  if (usage && usage.used >= usage.limit) {
    throw new Error("Limite de découvertes du jour atteinte.");
  }

  const [video] = await db.select().from(videos).where(eq(videos.id, videoId)).limit(1);
  if (!video) throw new Error("Vidéo introuvable");

  await db.insert(swipes).values({ userId, videoId, direction, reason: direction === "skip" ? reason : undefined });

  // "Garder" = signal de préférence ET ajout direct à la liste "à regarder
  // plus tard" — pas d'action séparée sur l'écran de swipe.
  if (direction === "like") {
    await db.insert(savedVideos).values({ userId, videoId }).onConflictDoNothing();
  }

  const delta =
    direction === "like" ? LIKE_WEIGHT_DELTA : reason ? SKIP_WITH_REASON_WEIGHT_DELTA : SKIP_WEIGHT_DELTA;
  for (const tag of video.tags) {
    await db
      .insert(userTagWeights)
      .values({ userId, tag, weight: String(delta), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [userTagWeights.userId, userTagWeights.tag],
        set: { weight: sql`${userTagWeights.weight} + ${delta}`, updatedAt: new Date() },
      });
  }

  return { success: true };
}
