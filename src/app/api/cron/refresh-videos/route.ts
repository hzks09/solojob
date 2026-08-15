import { NextResponse } from "next/server";
import { inArray, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { searchVideos, fetchVideoDetails, parseIsoDuration, type YoutubeVideoItem } from "@/lib/youtube/client";
import { MOOD_CATEGORIES } from "@/lib/youtube/moods";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEARCH_RESULTS_PER_MOOD = 25;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function upsertVideos(items: YoutubeVideoItem[], extraTag?: string) {
  for (const item of items) {
    const thumbnail =
      item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "";
    const durationSeconds = parseIsoDuration(item.contentDetails.duration);
    const baseTags = item.snippet.tags ?? [];
    const tags = extraTag && !baseTags.includes(extraTag) ? [extraTag, ...baseTags] : baseTags;
    const now = new Date();

    await db
      .insert(videos)
      .values({
        youtubeVideoId: item.id,
        title: item.snippet.title,
        thumbnailUrl: thumbnail,
        channelTitle: item.snippet.channelTitle,
        durationSeconds,
        language: item.snippet.defaultAudioLanguage ?? null,
        youtubeCategoryId: item.snippet.categoryId ?? null,
        tags,
        publishedAt: item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : null,
        lastRefreshedAt: now,
      })
      .onConflictDoUpdate({
        target: videos.youtubeVideoId,
        set: {
          title: item.snippet.title,
          thumbnailUrl: thumbnail,
          durationSeconds,
          tags,
          lastRefreshedAt: now,
        },
      });
  }
}

/**
 * Alimente et rafraîchit le pool de vidéos. Seul endroit du projet qui parle
 * à l'API YouTube — les swipes utilisateur ne font jamais d'appel direct.
 *
 * Budget de quota par exécution : `search.list` (100 unités) une fois par
 * mood prédéfinie (MOOD_CATEGORIES.length appels), + `videos.list`
 * (1 unité/appel) pour les métadonnées et le rafraîchissement des vidéos de
 * plus de 30 jours — largement sous les 10 000 unités/jour gratuites.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const errors: string[] = [];
  let searchCalls = 0;
  let videosListCalls = 0;
  let videosUpserted = 0;

  // 1) Découverte de nouvelles vidéos — une recherche par mood prédéfinie.
  for (const mood of MOOD_CATEGORIES) {
    try {
      const videoIds = await searchVideos(mood.searchQuery, SEARCH_RESULTS_PER_MOOD);
      searchCalls++;
      if (videoIds.length === 0) continue;

      const details = await fetchVideoDetails(videoIds);
      videosListCalls++;
      await upsertVideos(details, mood.tag);
      videosUpserted += details.length;
    } catch (err) {
      errors.push(`recherche "${mood.tag}": ${err instanceof Error ? err.message : "erreur inconnue"}`);
    }
  }

  // 2) Politique YouTube API Services : toute donnée en cache doit être
  // rafraîchie (ou supprimée) au maximum 30 jours après récupération.
  const staleThreshold = new Date(Date.now() - THIRTY_DAYS_MS);
  const stale = await db
    .select({ id: videos.id, youtubeVideoId: videos.youtubeVideoId })
    .from(videos)
    .where(lt(videos.lastRefreshedAt, staleThreshold));

  let refreshed = 0;
  let purged = 0;
  for (const batch of chunk(stale, 50)) {
    try {
      const details = await fetchVideoDetails(batch.map((v) => v.youtubeVideoId));
      videosListCalls++;
      await upsertVideos(details);
      refreshed += details.length;

      const foundIds = new Set(details.map((d) => d.id));
      const missingIds = batch.filter((v) => !foundIds.has(v.youtubeVideoId)).map((v) => v.id);
      if (missingIds.length > 0) {
        await db.delete(videos).where(inArray(videos.id, missingIds));
        purged += missingIds.length;
      }
    } catch (err) {
      errors.push(`rafraîchissement: ${err instanceof Error ? err.message : "erreur inconnue"}`);
    }
  }

  return NextResponse.json({ searchCalls, videosListCalls, videosUpserted, refreshed, purged, errors });
}
