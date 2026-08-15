"use server";

import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { videos, swipes, userTagWeights, savedVideos, type Video } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PLANS } from "@/lib/constants";
import { rateLimit } from "@/lib/rate-limit";

// Combien de vidéos les mieux notées entrent dans le tirage final — évite de
// toujours proposer strictement la mieux notée, laisse un peu de diversité.
const CANDIDATE_POOL_SIZE = 30;
const CANDIDATE_FETCH_LIMIT = 200;
const LIKE_WEIGHT_DELTA = 1;
const SKIP_WEIGHT_DELTA = -0.5;
// Part des propositions qui ignorent complètement le score appris pour
// piocher parmi les tags les moins explorés — sans ça, le score appris ne
// fait que renforcer les tags choisis à l'onboarding et l'utilisateur ne
// découvre jamais de nouvelles catégories.
const EXPLORATION_RATE = 0.18;

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Découvertes déjà servies aujourd'hui pour le forfait Gratuit — compte les
 * swipes existants sur une fenêtre temporelle plutôt que de maintenir un
 * compteur dédié (même logique que l'ancienne limite de factures/mois).
 * `null` = forfait illimité, rien à vérifier.
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
  | { status: "rate_limited" };

/** Pioche la prochaine vidéo à proposer, jamais d'appel à l'API YouTube ici. */
export async function getNextVideoAction(): Promise<NextVideoResult> {
  const current = await getCurrentUser();
  if (!current) return { status: "unauthenticated" };
  const userId = current.authUser.id;

  // Anti-bourrinage : rien n'empêchait un script d'appeler cette action en
  // boucle en dehors du rythme normal d'un swipe.
  if (!rateLimit(`discovery-next:${userId}`, 60, 60_000).success) {
    return { status: "rate_limited" };
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

  const pool = swipedIds.length
    ? await db.select().from(videos).where(notInArray(videos.id, swipedIds)).limit(CANDIDATE_FETCH_LIMIT)
    : await db.select().from(videos).limit(CANDIDATE_FETCH_LIMIT);

  if (pool.length === 0) return { status: "empty" };

  // Exploration epsilon-greedy : une partie des propositions ignore le score
  // appris et pioche au hasard parmi les tags les moins swipés jusqu'ici.
  if (Math.random() < EXPLORATION_RATE) {
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

  // Score = somme des poids appris pour les tags de la vidéo + un peu
  // d'aléatoire, pour éviter de boucler sur les mêmes catégories.
  const scored = pool
    .map((video) => ({
      video,
      score: video.tags.reduce((sum, tag) => sum + (weightByTag.get(tag) ?? 0), 0) + Math.random() * 2,
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

export async function recordSwipeAction(videoId: string, direction: "like" | "skip"): Promise<{ success: boolean }> {
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

  await db.insert(swipes).values({ userId, videoId, direction });

  // "Garder" = signal de préférence ET ajout direct à la liste "à regarder
  // plus tard" — pas d'action séparée sur l'écran de swipe.
  if (direction === "like") {
    await db.insert(savedVideos).values({ userId, videoId }).onConflictDoNothing();
  }

  const delta = direction === "like" ? LIKE_WEIGHT_DELTA : SKIP_WEIGHT_DELTA;
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
