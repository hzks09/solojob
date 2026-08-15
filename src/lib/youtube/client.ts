/**
 * Client minimal pour l'API YouTube Data v3. N'est appelé QUE par le job
 * planifié (`api/cron/refresh-videos`) — jamais au moment d'un swipe
 * utilisateur, pour rester très en dessous du quota gratuit (10 000
 * unités/jour ; `search.list` coûte 100 unités, `videos.list` coûte 1 unité).
 * Sans YOUTUBE_API_KEY, renvoie simplement des résultats vides — jamais
 * d'erreur (même logique de dégradation silencieuse que Resend/Sentry).
 */

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
  contentDetails: {
    duration: string; // format ISO 8601, ex. "PT4M13S"
  };
}

/** Convertit une durée ISO 8601 YouTube (ex. "PT4M13S") en secondes. */
export function parseIsoDuration(iso: string): number {
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
 * alterner pertinence/récence.
 */
export async function searchVideos(
  query: string,
  options: { maxResults?: number; pageToken?: string | null; order?: "relevance" | "date" } = {}
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
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`YouTube videos.list a échoué (${res.status})`);
  const data = (await res.json()) as { items: YoutubeVideoItem[] };
  return data.items;
}
