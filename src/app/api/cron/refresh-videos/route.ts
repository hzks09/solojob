import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { and, asc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { moodSearchCursors, videos, swipes, savedVideos } from "@/lib/db/schema";
import {
  searchVideos,
  fetchVideoDetails,
  isVideoSuitable,
  parseIsoDuration,
  type YoutubeVideoItem,
} from "@/lib/youtube/client";
import { MOOD_CATEGORIES, type SubCategory } from "@/lib/youtube/moods";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
// 50 = maximum autorisé par search.list, et le coût en quota (100 unités) est
// le même que pour 1 résultat — aucune raison de demander moins.
const SEARCH_RESULTS_PER_MOOD = 50;
// Plusieurs recherches par catégorie et par exécution, chacune reprenant là où
// la précédente s'est arrêtée (voir `moodSearchCursors`). C'est le levier
// principal pour faire grossir le catalogue.
const SEARCHES_PER_MOOD_PER_RUN = 6;
// Garde-fou de quota, exprimé dans l'unité qui compte vraiment : search.list
// coûte 100 unités et le forfait gratuit en donne 10 000/jour. 42 recherches
// = 4 200 unités, ce qui laisse de quoi relancer le job manuellement le même
// jour sans dépasser le quota. Ce plafond borne aussi la durée d'exécution,
// contrainte par la limite de 60 s d'une fonction Vercel (voir maxDuration).
const MAX_SEARCH_CALLS_PER_RUN = 42;
// Alterner le tri diversifie fortement les résultats d'une même formulation :
// `relevance` donne les plus pertinentes, `date` les plus récentes, et
// `viewCount` fait remonter les grands classiques, y compris anciens.
const SEARCH_ORDERS = ["relevance", "date", "viewCount"] as const;

/**
 * Le job enchaîne des dizaines d'appels réseau : il lui faut plus que les 10 s
 * accordées par défaut. 60 s est le maximum du plan gratuit Vercel — d'où le
 * plafond MAX_SEARCH_CALLS_PER_RUN, calibré pour tenir dedans. Une exécution
 * interrompue n'est de toute façon pas perdue : les curseurs avancent au fur et
 * à mesure, donc la suivante reprend là où celle-ci s'est arrêtée.
 */
export const maxDuration = 60;
// Budgets de temps cumulés depuis le début de l'exécution, répartis sous les
// 60 s de maxDuration : le rafraîchissement (imposé) s'arrête à 25 s, la
// découverte (discrétionnaire) à 40 s, et les ~20 s restantes suffisent aux
// purges finales. Chaque phase reprend là où elle s'est arrêtée à l'exécution
// suivante, donc une troncature ne perd rien.
const REFRESH_TIME_BUDGET_MS = 25_000;
const DISCOVERY_TIME_BUDGET_MS = 40_000;
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
// gratuit Supabase. Au rythme actuel du cron (jusqu'à 42 recherches/jour, soit
// quelques milliers de vidéos parcourues dont une minorité de nouvelles), ce
// seuil laisse largement de la marge — le catalogue peut grossir librement
// pour offrir plus de choix aux utilisateurs.
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

/**
 * Insertion groupée : une seule requête pour tout un lot plutôt qu'un
 * aller-retour par vidéo. À plusieurs milliers de vidéos par exécution, la
 * version ligne par ligne dépassait largement la durée maximale d'une fonction
 * Vercel.
 */
async function upsertVideos(items: YoutubeVideoItem[], extraTag?: string, subCategories: SubCategory[] = []) {
  const now = new Date();

  const rows = items
    // Mêmes critères que la modération manuelle des suggestions : pas de
    // musique, pas de restriction d'âge, lecture externe autorisée, vidéo
    // publique, durée exploitable.
    .filter((item) => isVideoSuitable(item).ok)
    .map((item) => {
      const subTags = detectSubTags(item, subCategories);
      return {
        youtubeVideoId: item.id,
        title: item.snippet.title,
        thumbnailUrl:
          item.snippet.thumbnails.high?.url ??
          item.snippet.thumbnails.medium?.url ??
          item.snippet.thumbnails.default?.url ??
          "",
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        durationSeconds: parseIsoDuration(item.contentDetails?.duration),
        language: item.snippet.defaultAudioLanguage ?? null,
        youtubeCategoryId: item.snippet.categoryId ?? null,
        tags: Array.from(new Set([...(extraTag ? [extraTag] : []), ...subTags, ...(item.snippet.tags ?? [])])),
        publishedAt: item.snippet.publishedAt ? new Date(item.snippet.publishedAt) : null,
        lastRefreshedAt: now,
      };
    });

  // Postgres refuse qu'un ON CONFLICT touche deux fois la même ligne dans un
  // même ordre : on dédoublonne le lot avant l'envoi.
  const deduped = [...new Map(rows.map((r) => [r.youtubeVideoId, r])).values()];
  if (deduped.length === 0) return 0;

  await db
    .insert(videos)
    .values(deduped)
    .onConflictDoUpdate({
      target: videos.youtubeVideoId,
      set: {
        title: sql`excluded.title`,
        thumbnailUrl: sql`excluded.thumbnail_url`,
        channelId: sql`excluded.channel_id`,
        durationSeconds: sql`excluded.duration_seconds`,
        tags: sql`excluded.tags`,
        lastRefreshedAt: sql`excluded.last_refreshed_at`,
      },
    });

  return deduped.length;
}

/**
 * Alimente et rafraîchit le pool de vidéos. Seul endroit du projet qui parle
 * à l'API YouTube — les swipes utilisateur ne font jamais d'appel direct.
 *
 * Budget de quota par exécution : `search.list` coûte 100 unités et le forfait
 * gratuit en donne 10 000/jour. Le job en fait au plus
 * MAX_SEARCH_CALLS_PER_RUN (42 → 4 200 unités), plus des `videos.list` à
 * 1 unité pièce pour les métadonnées et le rafraîchissement des vidéos de plus
 * de 30 jours. Il reste donc plus de la moitié du quota, de quoi déclencher une
 * exécution manuelle le même jour sans risque de dépassement.
 *
 * Chaque mood enchaîne plusieurs recherches par exécution, en avançant dans sa
 * pagination puis en passant à la formulation suivante une fois les pages
 * épuisées (voir `moodSearchCursors`) — c'est ce qui fait grossir le catalogue
 * au lieu de rappeler indéfiniment la même première page.
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

  const startedAt = Date.now();
  const errors: string[] = [];
  let searchCalls = 0;
  let videosListCalls = 0;
  let videosUpserted = 0;

  // 1) Politique YouTube API Services : toute donnée en cache doit être
  // rafraîchie (ou supprimée) au maximum 30 jours après récupération. Cette
  // étape passe AVANT la découverte car elle est imposée, alors que faire
  // grossir le catalogue est discrétionnaire — si le temps vient à manquer,
  // c'est la découverte qui doit être tronquée, jamais l'inverse.
  const staleThreshold = new Date(Date.now() - THIRTY_DAYS_MS);
  const stale = await db
    .select({ id: videos.id, youtubeVideoId: videos.youtubeVideoId })
    .from(videos)
    .where(lt(videos.lastRefreshedAt, staleThreshold));

  let refreshed = 0;
  let purged = 0;
  let refreshTruncated = false;
  for (const batch of chunk(stale, 50)) {
    // Sans ce plafond, une vague de vidéos mises en cache le même jour arrive à
    // péremption simultanément un mois plus tard et cette phase consommerait
    // seule tout le budget de la fonction, empêchant la découverte de tourner —
    // voire se ferait couper en plein milieu par Vercel. Ce qui n'est pas
    // traité ici reste périmé et sera repris à l'exécution suivante.
    if (Date.now() - startedAt > REFRESH_TIME_BUDGET_MS) {
      refreshTruncated = true;
      break;
    }

    try {
      const details = await fetchVideoDetails(batch.map((v) => v.youtubeVideoId));
      videosListCalls++;
      refreshed += await upsertVideos(details);

      const foundIds = new Set(details.map((d) => d.id));
      // Une vidéo peut avoir disparu de YouTube, ou être devenue inéligible
      // depuis sa mise en cache (passée en privé, restreinte par l'âge,
      // intégration désactivée). Dans les deux cas on la retire : la garder
      // reviendrait à la reproposer indéfiniment sans jamais pouvoir la
      // rafraîchir, donc à retraiter le même lot à chaque exécution.
      const unsuitableIds = new Set(details.filter((d) => !isVideoSuitable(d).ok).map((d) => d.id));
      const toDelete = batch
        .filter((v) => !foundIds.has(v.youtubeVideoId) || unsuitableIds.has(v.youtubeVideoId))
        .map((v) => v.id);
      if (toDelete.length > 0) {
        await db.delete(videos).where(inArray(videos.id, toDelete));
        purged += toDelete.length;
      }
    } catch (err) {
      errors.push(`rafraîchissement: ${err instanceof Error ? err.message : "erreur inconnue"}`);
    }
  }

  // 2) Découverte de nouvelles vidéos — plusieurs recherches par mood, chacune
  // reprenant la pagination là où la précédente s'est arrêtée.
  for (const mood of MOOD_CATEGORIES) {
    for (let i = 0; i < SEARCHES_PER_MOOD_PER_RUN; i++) {
      if (searchCalls >= MAX_SEARCH_CALLS_PER_RUN) break;
      // Coupure nette avant la limite de la fonction : les curseurs ayant déjà
      // avancé, la prochaine exécution reprendra simplement la suite.
      if (Date.now() - startedAt > DISCOVERY_TIME_BUDGET_MS) break;

      try {
        // Relu à chaque tour : le curseur vient d'être avancé par l'itération
        // précédente, c'est ce qui fait progresser la pagination.
        const cursor = await getCursor(mood.tag);
        const variant = mood.searchQueries[cursor.variantIndex % mood.searchQueries.length];
        const order = SEARCH_ORDERS[cursor.variantIndex % SEARCH_ORDERS.length];

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
        videosUpserted += await upsertVideos(details, mood.tag, mood.subCategories);
      } catch (err) {
        errors.push(`recherche "${mood.tag}": ${err instanceof Error ? err.message : "erreur inconnue"}`);
        // Inutile d'insister sur cette catégorie : une erreur est en général
        // globale (quota épuisé, clé invalide) et non propre à une page.
        break;
      }
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
    // Signale qu'il restait des vidéos périmées à traiter : utile pour repérer
    // que le budget de temps est devenu trop juste sans avoir à lire les logs.
    refreshTruncated,
    staleRemaining: refreshTruncated ? stale.length - refreshed - purged : 0,
    errors,
  });
}
