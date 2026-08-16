import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { and, asc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { moodSearchCursors, videos, swipes, savedVideos } from "@/lib/db/schema";
import { searchVideos, fetchVideoDetails, parseIsoDuration, type YoutubeVideoItem } from "@/lib/youtube/client";
import { MOOD_CATEGORIES, type SubCategory } from "@/lib/youtube/moods";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const SEARCH_RESULTS_PER_MOOD = 25;
// Un skip vieux de plus de 90 jours n'a presque plus d'utilité : le poids
// appris par tag (userTagWeights) capture déjà le signal, et la fenêtre
// d'exclusion "déjà vu" ne regarde de toute façon que les 60 derniers jours
// (voir RECENT_SWIPE_LOOKBACK_DAYS dans discovery.ts) — si la vidéo revient
// occasionnellement dans les propositions, l'utilisateur peut la re-swiper
// sans conséquence. Les "like" sont gardés indéfiniment (alimentent
// savedVideos, qui doit rester fiable).
const SKIP_SWIPE_RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
// Au-delà de ce nombre de vidéos en cache, on retire les plus anciennes
// jamais aimées par personne plutôt que de laisser le pool grossir sans
// limite — un garde-fou contre un bug/une boucle d'ingestion, pas une
// urgence de stockage : une ligne `videos` ne pèse qu'1-2 Ko, donc même
// 50 000 lignes ne représentent qu'environ 60 Mo sur les 500 Mo du plan
// gratuit Supabase. Au rythme actuel du cron (~8 recherches/jour), ce seuil
// est hors de portée avant des années — le catalogue peut donc grossir
// librement pour offrir plus de choix aux utilisateurs.
const VIDEO_POOL_CAP = 50_000;

async function getCursor(tag: string) {
  const [existing] = await db.select().from(moodSearchCursors).where(eq(moodSearchCursors.tag, tag)).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(moodSearchCursors).values({ tag }).returning();
  return created;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Détecte les sous-catégories d'un mood dans le titre/les tags YouTube d'une
 * vidéo — simple correspondance de mots-clés, aucun appel API supplémentaire.
 */
function detectSubTags(item: YoutubeVideoItem, subCategories: SubCategory[]): string[] {
  const haystack = `${item.snippet.title} ${(item.snippet.tags ?? []).join(" ")}`.toLowerCase();
  return subCategories.filter((sub) => sub.matchKeywords.some((kw) => haystack.includes(kw.toLowerCase()))).map((sub) => sub.tag);
}

async function upsertVideos(items: YoutubeVideoItem[], extraTag?: string, subCategories: SubCategory[] = []) {
  for (const item of items) {
    const thumbnail =
      item.snippet.thumbnails.high?.url ?? item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url ?? "";
    const durationSeconds = parseIsoDuration(item.contentDetails.duration);
    const baseTags = item.snippet.tags ?? [];
    const subTags = detectSubTags(item, subCategories);
    const tags = Array.from(new Set([...(extraTag ? [extraTag] : []), ...subTags, ...baseTags]));
    const now = new Date();

    await db
      .insert(videos)
      .values({
        youtubeVideoId: item.id,
        title: item.snippet.title,
        thumbnailUrl: thumbnail,
        channelId: item.snippet.channelId,
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
          channelId: item.snippet.channelId,
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
 * mood prédéfinie (MOOD_CATEGORIES.length appels, soit 800 unités pour 8
 * moods), + `videos.list` (1 unité/appel) pour les métadonnées et le
 * rafraîchissement des vidéos de plus de 30 jours — largement sous les
 * 10 000 unités/jour gratuites (le cron ne tourne qu'une fois/jour, voir
 * vercel.json). Chaque mood avance dans sa pagination (ou passe à la
 * formulation suivante une fois les pages épuisées) au lieu de rappeler
 * systématiquement la même première page — voir `moodSearchCursors`.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  // Garde explicite : un secret absent ou vide ne doit jamais matcher par
  // accident (ex. si CRON_SECRET n'est pas défini en production).
  if (!cronSecret) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const authHeader = req.headers.get("authorization") ?? "";
  const expected = Buffer.from(`Bearer ${cronSecret}`);
  const supplied = Buffer.from(authHeader);
  // timingSafeEqual lève une exception sur des tailles différentes — on
  // court-circuite avant plutôt que de laisser planter la comparaison.
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const errors: string[] = [];
  let searchCalls = 0;
  let videosListCalls = 0;
  let videosUpserted = 0;

  // 1) Découverte de nouvelles vidéos — une recherche par mood prédéfinie,
  // qui avance dans sa pagination (ou change de formulation) à chaque run.
  for (const mood of MOOD_CATEGORIES) {
    try {
      const cursor = await getCursor(mood.tag);
      const variant = mood.searchQueries[cursor.variantIndex % mood.searchQueries.length];
      // Alterne pertinence/récence selon la variante en cours, pour que le
      // pool ne se fige pas sur d'anciennes vidéos.
      const order = cursor.variantIndex % 2 === 0 ? "relevance" : "date";

      const { videoIds, nextPageToken } = await searchVideos(variant, {
        maxResults: SEARCH_RESULTS_PER_MOOD,
        pageToken: cursor.pageToken,
        order,
      });
      searchCalls++;

      if (nextPageToken) {
        // Encore des pages sur cette formulation : on avance dedans la prochaine fois.
        await db
          .update(moodSearchCursors)
          .set({ pageToken: nextPageToken, updatedAt: new Date() })
          .where(eq(moodSearchCursors.tag, mood.tag));
      } else {
        // Pages épuisées : on passe à la formulation suivante en repartant de zéro.
        await db
          .update(moodSearchCursors)
          .set({ variantIndex: cursor.variantIndex + 1, pageToken: null, updatedAt: new Date() })
          .where(eq(moodSearchCursors.tag, mood.tag));
      }

      if (videoIds.length === 0) continue;

      const details = await fetchVideoDetails(videoIds);
      videosListCalls++;
      await upsertVideos(details, mood.tag, mood.subCategories);
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

  // 3) Purge des vieux skips — voir SKIP_SWIPE_RETENTION_MS ci-dessus. Les
  // "like" ne sont jamais touchés ici.
  let skipsPurged = 0;
  try {
    const skipRetentionThreshold = new Date(Date.now() - SKIP_SWIPE_RETENTION_MS);
    const deletedSkips = await db
      .delete(swipes)
      .where(and(eq(swipes.direction, "skip"), lt(swipes.createdAt, skipRetentionThreshold)))
      .returning({ id: swipes.id });
    skipsPurged = deletedSkips.length;
  } catch (err) {
    errors.push(`purge skips: ${err instanceof Error ? err.message : "erreur inconnue"}`);
  }

  // 4) Cap sur la taille du pool — retire les vidéos les plus anciennes
  // (cachedAt) parmi celles jamais likées, seulement si on dépasse le seuil.
  let videosCapped = 0;
  try {
    const [{ value: totalVideos }] = await db.select({ value: sql<number>`count(*)::int` }).from(videos);
    if (totalVideos > VIDEO_POOL_CAP) {
      const excess = totalVideos - VIDEO_POOL_CAP;
      const removable = await db
        .select({ id: videos.id })
        .from(videos)
        .leftJoin(savedVideos, eq(savedVideos.videoId, videos.id))
        .where(isNull(savedVideos.userId))
        .orderBy(asc(videos.cachedAt))
        .limit(excess);

      if (removable.length > 0) {
        await db.delete(videos).where(
          inArray(
            videos.id,
            removable.map((v) => v.id)
          )
        );
        videosCapped = removable.length;
      }
    }
  } catch (err) {
    errors.push(`cap pool vidéos: ${err instanceof Error ? err.message : "erreur inconnue"}`);
  }

  return NextResponse.json({
    searchCalls,
    videosListCalls,
    videosUpserted,
    refreshed,
    purged,
    skipsPurged,
    videosCapped,
    errors,
  });
}
