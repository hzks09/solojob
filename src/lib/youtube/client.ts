/**
 * Client minimal pour l'API YouTube Data v3. N'est appelé QUE par le job
 * planifié (`api/cron/refresh-videos`) — jamais au moment d'un swipe
 * utilisateur, pour rester très en dessous du quota gratuit (10 000
 * unités/jour ; `search.list` coûte 100 unités, `videos.list` coûte 1 unité).
 * Sans YOUTUBE_API_KEY, renvoie simplement des résultats vides — jamais
 * d'erreur (même logique de dégradation silencieuse que Resend/Sentry).
 */

import { YOUTUBE_MUSIC_CATEGORY_ID } from "./moods";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

interface YoutubeThumbnails {
  default?: { url: string };
  medium?: { url: string };
  high?: { url: string };
}

export interface YoutubeVideoItem {
  id: string;
  snippet: {
    title: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: YoutubeThumbnails;
    tags?: string[];
    categoryId?: string;
    defaultAudioLanguage?: string;
  };
  // Optionnel en pratique : l'API omet le bloc (ou la durée) sur certains
  // éléments, notamment les directs.
  contentDetails?: {
    duration?: string; // format ISO 8601, ex. "PT4M13S"
    contentRating?: { ytRating?: string }; // "ytAgeRestricted" si la vidéo est restreinte
  };
  status?: {
    embeddable?: boolean;
    privacyStatus?: string; // "public" | "unlisted" | "private"
  };
}

/**
 * Extrait un ID vidéo YouTube (11 caractères) depuis une URL classique,
 * une URL courte (youtu.be), une URL Shorts/embed, ou un ID déjà brut —
 * utilisé pour la validation des suggestions utilisateur.
 */
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.endsWith("youtube.com")) {
      const vParam = url.searchParams.get("v");
      if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) return vParam;
      const match = url.pathname.match(/\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})/);
      if (match) return match[1];
    }
  } catch {
    return null;
  }

  return null;
}

export type UnsuitableReason =
  | "age_restricted"
  | "not_embeddable"
  | "not_public"
  | "music"
  | "no_duration"
  | "short";

/**
 * Durée maximale d'un Short YouTube, et donc seuil d'exclusion du pool.
 *
 * L'API ne dit nulle part qu'une vidéo est un Short : ni champ dédié, ni
 * format d'image exploitable. La durée est le seul signal fiable — un Short
 * ne peut pas dépasser 3 minutes (60 s avant octobre 2024).
 *
 * Conséquence assumée : une vraie vidéo de 2 minutes est écartée elle aussi.
 * C'est le prix d'une garantie stricte « aucun Short » ; baisser ce seuil à 60
 * laisserait repasser tous les Shorts au format long.
 */
export const SHORTS_MAX_SECONDS = 180;

/**
 * Critères d'entrée dans le catalogue, partagés par les deux seules portes
 * d'accès : le job planifié et les suggestions utilisateur. Les avoir en double
 * laissait passer par le job des vidéos que la modération manuelle refusait
 * (restriction d'âge notamment) — d'autant plus problématique depuis que le job
 * ingère des milliers de vidéos par exécution au lieu de quelques dizaines.
 */
export function isVideoSuitable(item: YoutubeVideoItem): { ok: true } | { ok: false; reason: UnsuitableReason } {
  if (item.contentDetails?.contentRating?.ytRating === "ytAgeRestricted") {
    return { ok: false, reason: "age_restricted" };
  }
  if (item.status?.embeddable === false) return { ok: false, reason: "not_embeddable" };
  if (item.status?.privacyStatus && item.status.privacyStatus !== "public") {
    return { ok: false, reason: "not_public" };
  }
  if (item.snippet.categoryId === YOUTUBE_MUSIC_CATEGORY_ID) return { ok: false, reason: "music" };
  // Durée nulle = direct ou durée illisible : la carte afficherait "0:00" et
  // les filtres de durée n'auraient aucun sens.
  const durationSeconds = parseIsoDuration(item.contentDetails?.duration);
  if (durationSeconds === 0) return { ok: false, reason: "no_duration" };
  // Le job de rafraîchissement repasse ce test sur tout le pool : ajouter ce
  // critère ici suffit à faire purger les Shorts déjà en cache, sans script
  // de migration dédié.
  if (durationSeconds <= SHORTS_MAX_SECONDS) return { ok: false, reason: "short" };
  return { ok: true };
}

/** Message destiné à l'utilisateur qui propose une vidéo refusée. */
export const UNSUITABLE_MESSAGES: Record<UnsuitableReason, string> = {
  age_restricted: "Cette vidéo est soumise à une restriction d'âge, elle ne peut pas être proposée.",
  not_embeddable: "Cette vidéo ne peut pas être intégrée (lecture externe désactivée par la chaîne).",
  not_public: "Cette vidéo n'est pas publique.",
  music: "Loupick ne propose pas de contenu musical.",
  no_duration: "Cette vidéo n'a pas de durée exploitable (direct en cours ?).",
  short: "Loupick ne propose pas de Shorts — il faut au moins 3 minutes.",
};

/**
 * Convertit une durée ISO 8601 YouTube (ex. "PT4M13S") en secondes. Renvoie 0
 * si la durée est absente ou illisible : l'API ne la fournit pas pour les
 * directs, et une exception ici ferait perdre tout le lot en cours.
 */
export function parseIsoDuration(iso?: string | null): number {
  if (!iso) return 0;
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;
  const [, h, m, s] = match;
  return (Number(h) || 0) * 3600 + (Number(m) || 0) * 60 + (Number(s) || 0);
}

export interface SearchVideosResult {
  videoIds: string[];
  nextPageToken: string | null;
}

/**
 * search.list — coûte 100 unités de quota par appel. Ne renvoie que les IDs
 * (part=id). Supporte la pagination (`pageToken`) pour que l'appelant puisse
 * avancer dans les résultats d'une exécution à l'autre plutôt que de
 * toujours récupérer la même première page, et le tri (`order`) pour
 * alterner pertinence/récence/popularité. `maxResults` est plafonné à 50 par
 * l'API — et comme le coût est le même quel que soit ce nombre, il n'y a
 * aucune raison de demander moins.
 */
export async function searchVideos(
  query: string,
  options: { maxResults?: number; pageToken?: string | null; order?: "relevance" | "date" | "viewCount" } = {}
): Promise<SearchVideosResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return { videoIds: [], nextPageToken: null };

  const { maxResults = 25, pageToken, order } = options;

  const url = new URL(`${YOUTUBE_API_BASE}/search`);
  url.searchParams.set("part", "id");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoEmbeddable", "true");
  url.searchParams.set("safeSearch", "moderate");
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);
  // Loupick cible le public francophone — biaise le classement YouTube vers
  // la France/le français sans exclure de résultats pertinents en anglais
  // (contrairement à un filtre de langue strict côté base de données).
  url.searchParams.set("regionCode", "FR");
  url.searchParams.set("relevanceLanguage", "fr");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  if (order) url.searchParams.set("order", order);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube search.list a échoué (${res.status})`);
  const data = (await res.json()) as { items: { id: { videoId: string } }[]; nextPageToken?: string };
  return {
    videoIds: data.items.map((item) => item.id.videoId).filter(Boolean),
    nextPageToken: data.nextPageToken ?? null,
  };
}

/** videos.list — coûte seulement 1 unité par appel (jusqu'à 50 IDs à la fois). */
export async function fetchVideoDetails(videoIds: string[]): Promise<YoutubeVideoItem[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey || videoIds.length === 0) return [];

  const url = new URL(`${YOUTUBE_API_BASE}/videos`);
  url.searchParams.set("part", "snippet,contentDetails,status");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube videos.list a échoué (${res.status})`);
  const data = (await res.json()) as { items: YoutubeVideoItem[] };
  return data.items;
}
