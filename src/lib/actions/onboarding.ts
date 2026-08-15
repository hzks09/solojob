"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userTagWeights } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { MOOD_CATEGORIES } from "@/lib/youtube/moods";

const INITIAL_WEIGHT = "2";
const MIN_TAGS = 2;

/** Vrai dès que l'utilisateur a au moins un poids de tag — onboarding déjà fait. */
export async function hasCompletedOnboarding(): Promise<boolean> {
  const current = await getCurrentUser();
  if (!current) return true;

  const [row] = await db
    .select({ userId: userTagWeights.userId })
    .from(userTagWeights)
    .where(eq(userTagWeights.userId, current.authUser.id))
    .limit(1);

  return Boolean(row);
}

export async function completeOnboardingAction(tags: string[]): Promise<{ success: boolean; error?: string }> {
  const current = await getCurrentUser();
  if (!current) return { success: false, error: "Non authentifié" };

  const validTags = tags.filter((t) => MOOD_CATEGORIES.some((mood) => mood.tag === t));
  if (validTags.length < MIN_TAGS) {
    return { success: false, error: `Choisis au moins ${MIN_TAGS} catégories` };
  }

  for (const tag of validTags) {
    await db
      .insert(userTagWeights)
      .values({ userId: current.authUser.id, tag, weight: INITIAL_WEIGHT, updatedAt: new Date() })
      .onConflictDoNothing();
  }

  return { success: true };
}
