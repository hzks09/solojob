"use server";

import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { videos, swipes, userTagWeights, savedVideos, type Video } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { PLANS } from "@/lib/constants";

// Combien de vidéos les mieux notées entrent dans le tirage final — évite de
// toujours proposer strictement la mieux notée, laisse un peu de diversité.
const CANDIDATE_POOL_SIZE = 30;
const CANDIDATE_FETCH_LIMIT = 200;
const LIKE_WEIGHT_DELTA = 1;
const SKIP_WEIGHT_DELTA = -0.5;

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
  | { status: "unauthenticated" };

/** Pioche la prochaine vidéo à proposer, jamais d'appel à l'API YouTube ici. */
export async function getNextVideoAction(): Promise<NextVideoResult> {
  const current = await getCurrentUser();
  if (!current) return { status: "unauthenticated" };
  const userId = current.authUser.id;

  const usage = await getDailyDiscoveryUsage();
  if (usage && usage.used >= usage.limit) {
    return { status: "limit_reached" };
  }

  const alreadySwiped = await db.select({ videoId: swipes.videoId }).from(swipes).where(eq(swipes.userId, userId));
  const swipedIds = alreadySwiped.map((s) => s.videoId);

  const pool = swipedIds.length
    ? await db.select().from(videos).where(notInArray(videos.id, swipedIds)).limit(CANDIDATE_FETCH_LIMIT)
    : await db.select().from(videos).limit(CANDIDATE_FETCH_LIMIT);

  if (pool.length === 0) return { status: "empty" };

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
