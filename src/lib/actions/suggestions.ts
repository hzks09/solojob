"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { videos, videoSuggestions, type VideoSuggestion } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/rate-limit";
import { fetchVideoDetails, parseIsoDuration, parseYoutubeVideoId, type YoutubeVideoItem } from "@/lib/youtube/client";
import { YOUTUBE_MUSIC_CATEGORY_ID } from "@/lib/youtube/moods";

const DAILY_SUGGESTION_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

export type SubmitSuggestionResult = { success: true } | { success: false; error: string };

async function requireAdmin() {
  const current = await getCurrentUser();
  if (!current?.profile?.isAdmin) throw new Error("Accès réservé aux administrateurs");
  return current;
}

/** Vérifie qu'une vidéo est publique et embarquable — rejette avant toute écriture en base sinon. */
function isSuggestable(item: YoutubeVideoItem): { ok: true } | { ok: false; error: string } {
  if (item.contentDetails.contentRating?.ytRating === "ytAgeRestricted") {
    return { ok: false, error: "Cette vidéo est soumise à une restriction d'âge, elle ne peut pas être proposée." };
  }
  if (item.status?.embeddable === false) {
    return { ok: false, error: "Cette vidéo ne peut pas être intégrée (lecture externe désactivée par la chaîne)." };
  }
  if (item.status?.privacyStatus && item.status.privacyStatus !== "public") {
    return { ok: false, error: "Cette vidéo n'est pas publique." };
  }
  if (item.snippet.categoryId === YOUTUBE_MUSIC_CATEGORY_ID) {
    return { ok: false, error: "Loupick ne propose pas de contenu musical." };
  }
  return { ok: true };
}

export async function submitSuggestionAction(rawInput: string): Promise<SubmitSuggestionResult> {
  const current = await getCurrentUser();
  if (!current) return { success: false, error: "Non authentifié" };
  const userId = current.authUser.id;

  if (!(await rateLimit(`suggestion-submit:${userId}`, DAILY_SUGGESTION_LIMIT, DAY_MS)).success) {
    return { success: false, error: "Tu as atteint la limite de 5 suggestions par jour." };
  }

  const youtubeVideoId = parseYoutubeVideoId(rawInput);
  if (!youtubeVideoId) {
    return { success: false, error: "URL ou ID YouTube invalide." };
  }

  const [alreadyInPool] = await db.select({ id: videos.id }).from(videos).where(eq(videos.youtubeVideoId, youtubeVideoId)).limit(1);
  if (alreadyInPool) {
    return { success: false, error: "Cette vidéo est déjà dans le catalogue Loupick." };
  }

  const [alreadySuggested] = await db
    .select({ id: videoSuggestions.id })
    .from(videoSuggestions)
    .where(eq(videoSuggestions.youtubeVideoId, youtubeVideoId))
    .limit(1);
  if (alreadySuggested) {
    return { success: false, error: "Cette vidéo a déjà été proposée." };
  }

  // Un seul appel videos.list (1 unité de quota) — jamais search.list ici.
  const [details] = await fetchVideoDetails([youtubeVideoId]);
  if (!details) {
    return { success: false, error: "Vidéo introuvable ou privée." };
  }

  const suggestable = isSuggestable(details);
  if (!suggestable.ok) {
    return { success: false, error: suggestable.error };
  }

  await db.insert(videoSuggestions).values({ userId, youtubeVideoId, status: "pending" });
  revalidatePath("/suggestions");
  return { success: true };
}

export async function listMySuggestionsAction(): Promise<VideoSuggestion[]> {
  const current = await getCurrentUser();
  if (!current) return [];

  return db
    .select()
    .from(videoSuggestions)
    .where(eq(videoSuggestions.userId, current.authUser.id))
    .orderBy(desc(videoSuggestions.submittedAt));
}

export type PendingSuggestion = VideoSuggestion & { details: YoutubeVideoItem | null };

/** Admin uniquement. Un seul appel `videos.list` groupé (1 unité, quel que soit le nombre en attente). */
export async function listPendingSuggestionsAction(): Promise<PendingSuggestion[]> {
  await requireAdmin();

  const pending = await db
    .select()
    .from(videoSuggestions)
    .where(eq(videoSuggestions.status, "pending"))
    .orderBy(desc(videoSuggestions.submittedAt));

  if (pending.length === 0) return [];

  const details = await fetchVideoDetails(pending.map((p) => p.youtubeVideoId));
  const detailsById = new Map(details.map((d) => [d.id, d]));

  return pending.map((p) => ({ ...p, details: detailsById.get(p.youtubeVideoId) ?? null }));
}

export async function approveSuggestionAction(suggestionId: string): Promise<{ success: boolean }> {
  await requireAdmin();

  const [suggestion] = await db
    .select()
    .from(videoSuggestions)
    .where(and(eq(videoSuggestions.id, suggestionId), eq(videoSuggestions.status, "pending")))
    .limit(1);
  if (!suggestion) throw new Error("Suggestion introuvable ou déjà traitée");

  const [details] = await fetchVideoDetails([suggestion.youtubeVideoId]);
  if (!details) throw new Error("Vidéo introuvable côté YouTube (peut-être supprimée depuis la soumission)");

  const suggestable = isSuggestable(details);
  if (!suggestable.ok) throw new Error(suggestable.error);

  const thumbnail =
    details.snippet.thumbnails.high?.url ?? details.snippet.thumbnails.medium?.url ?? details.snippet.thumbnails.default?.url ?? "";

  await db
    .insert(videos)
    .values({
      youtubeVideoId: details.id,
      title: details.snippet.title,
      thumbnailUrl: thumbnail,
      channelId: details.snippet.channelId,
      channelTitle: details.snippet.channelTitle,
      durationSeconds: parseIsoDuration(details.contentDetails.duration),
      language: details.snippet.defaultAudioLanguage ?? null,
      youtubeCategoryId: details.snippet.categoryId ?? null,
      tags: details.snippet.tags ?? [],
      fromSuggestion: true,
      publishedAt: details.snippet.publishedAt ? new Date(details.snippet.publishedAt) : null,
      lastRefreshedAt: new Date(),
    })
    .onConflictDoNothing();

  await db
    .update(videoSuggestions)
    .set({ status: "approved", reviewedAt: new Date() })
    .where(eq(videoSuggestions.id, suggestionId));

  revalidatePath("/suggestions");
  return { success: true };
}

export async function rejectSuggestionAction(suggestionId: string): Promise<{ success: boolean }> {
  await requireAdmin();

  await db
    .update(videoSuggestions)
    .set({ status: "rejected", reviewedAt: new Date() })
    .where(and(eq(videoSuggestions.id, suggestionId), eq(videoSuggestions.status, "pending")));

  revalidatePath("/suggestions");
  return { success: true };
}
