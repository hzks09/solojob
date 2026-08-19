import { describe, expect, it } from "vitest";
import { isVideoSuitable, parseIsoDuration, parseYoutubeVideoId, type YoutubeVideoItem } from "./client";

describe("parseIsoDuration", () => {
  it("convertit les formats ISO 8601 renvoyés par YouTube", () => {
    expect(parseIsoDuration("PT30S")).toBe(30);
    expect(parseIsoDuration("PT4M13S")).toBe(253);
    expect(parseIsoDuration("PT1H")).toBe(3600);
    expect(parseIsoDuration("PT2H5M")).toBe(7500);
    expect(parseIsoDuration("PT1H30M45S")).toBe(5445);
  });

  it("renvoie 0 sur une durée absente ou illisible plutôt que de lever", () => {
    // L'API omet la durée sur les directs ; une exception ici faisait perdre
    // tout le lot d'ingestion en cours (bug observé en production).
    expect(parseIsoDuration(undefined)).toBe(0);
    expect(parseIsoDuration(null)).toBe(0);
    expect(parseIsoDuration("")).toBe(0);
    expect(parseIsoDuration("n'importe quoi")).toBe(0);
    expect(parseIsoDuration("P1D")).toBe(0);
  });
});

describe("parseYoutubeVideoId", () => {
  const id = "dQw4w9WgXcQ";

  it("accepte un identifiant brut", () => {
    expect(parseYoutubeVideoId(id)).toBe(id);
    expect(parseYoutubeVideoId(`  ${id}  `)).toBe(id);
  });

  it("extrait l'identifiant des différentes formes d'URL", () => {
    expect(parseYoutubeVideoId(`https://www.youtube.com/watch?v=${id}`)).toBe(id);
    expect(parseYoutubeVideoId(`https://www.youtube.com/watch?v=${id}&t=42s`)).toBe(id);
    expect(parseYoutubeVideoId(`https://youtu.be/${id}`)).toBe(id);
    expect(parseYoutubeVideoId(`https://www.youtube.com/shorts/${id}`)).toBe(id);
    expect(parseYoutubeVideoId(`https://www.youtube.com/embed/${id}`)).toBe(id);
  });

  it("rejette ce qui n'est pas un identifiant exploitable", () => {
    expect(parseYoutubeVideoId("")).toBeNull();
    expect(parseYoutubeVideoId("pas une url")).toBeNull();
    expect(parseYoutubeVideoId("trop-court")).toBeNull();
    expect(parseYoutubeVideoId("beaucoup-trop-long-pour-un-id")).toBeNull();
    expect(parseYoutubeVideoId("https://vimeo.com/123456")).toBeNull();
    expect(parseYoutubeVideoId("https://www.youtube.com/watch?v=trop-court")).toBeNull();
  });
});

/**
 * Vidéo valide minimale, que chaque test dégrade sur un seul critère. Les
 * options sont nommées explicitement plutôt que fusionnées par spread : avec un
 * `Partial` profond, passer `{ contentDetails: {} }` pour retirer la durée ne
 * retirait rien du tout (le spread d'un objet vide n'écrase aucune clé).
 */
function videoItem(
  opts: {
    categoryId?: string;
    duration?: string;
    ytRating?: string;
    embeddable?: boolean;
    privacyStatus?: string;
    omitStatus?: boolean;
  } = {}
): YoutubeVideoItem {
  const { categoryId = "22", duration, ytRating, embeddable = true, privacyStatus = "public", omitStatus } = opts;
  return {
    id: "dQw4w9WgXcQ",
    snippet: {
      title: "Une vidéo",
      channelId: "UC123",
      channelTitle: "Une chaîne",
      publishedAt: "2026-01-01T00:00:00Z",
      thumbnails: { high: { url: "https://exemple.test/x.jpg" } },
      categoryId,
    },
    contentDetails: { duration, ...(ytRating ? { contentRating: { ytRating } } : {}) },
    ...(omitStatus ? {} : { status: { embeddable, privacyStatus } }),
  };
}

/** Durée valide par défaut, à passer explicitement dans les cas « tout va bien ». */
const OK = { duration: "PT4M13S" } as const;

describe("isVideoSuitable", () => {
  it("accepte une vidéo publique, intégrable, non musicale et de durée connue", () => {
    expect(isVideoSuitable(videoItem(OK))).toEqual({ ok: true });
  });

  it("refuse une vidéo soumise à restriction d'âge", () => {
    expect(isVideoSuitable(videoItem({ ...OK, ytRating: "ytAgeRestricted" }))).toEqual({
      ok: false,
      reason: "age_restricted",
    });
  });

  it("refuse une vidéo dont l'intégration est désactivée", () => {
    expect(isVideoSuitable(videoItem({ ...OK, embeddable: false }))).toEqual({
      ok: false,
      reason: "not_embeddable",
    });
  });

  it("refuse une vidéo non publique", () => {
    expect(isVideoSuitable(videoItem({ ...OK, privacyStatus: "unlisted" }))).toEqual({
      ok: false,
      reason: "not_public",
    });
  });

  it("refuse la catégorie musicale de YouTube", () => {
    expect(isVideoSuitable(videoItem({ ...OK, categoryId: "10" }))).toEqual({ ok: false, reason: "music" });
  });

  it("refuse une vidéo sans durée exploitable (direct)", () => {
    expect(isVideoSuitable(videoItem())).toEqual({ ok: false, reason: "no_duration" });
  });

  it("refuse un Short, à l'ancienne durée comme à la nouvelle", () => {
    // 60 s : format d'origine. 180 s : plafond depuis octobre 2024 — un seuil
    // à 60 s laisserait repasser tout ce qui a été publié depuis.
    expect(isVideoSuitable(videoItem({ duration: "PT45S" }))).toEqual({ ok: false, reason: "short" });
    expect(isVideoSuitable(videoItem({ duration: "PT1M" }))).toEqual({ ok: false, reason: "short" });
    expect(isVideoSuitable(videoItem({ duration: "PT2M30S" }))).toEqual({ ok: false, reason: "short" });
    expect(isVideoSuitable(videoItem({ duration: "PT3M" }))).toEqual({ ok: false, reason: "short" });
  });

  it("accepte juste au-dessus du seuil", () => {
    expect(isVideoSuitable(videoItem({ duration: "PT3M1S" }))).toEqual({ ok: true });
  });

  it("tolère l'absence du bloc status, que l'API n'envoie pas toujours", () => {
    expect(isVideoSuitable(videoItem({ ...OK, omitStatus: true }))).toEqual({ ok: true });
  });

  it("applique les critères dans un ordre stable (restriction d'âge avant durée)", () => {
    // Une vidéo cumulant plusieurs défauts doit donner un motif déterministe,
    // sinon le message affiché à l'utilisateur varierait sans raison.
    expect(isVideoSuitable(videoItem({ ytRating: "ytAgeRestricted" }))).toEqual({
      ok: false,
      reason: "age_restricted",
    });
  });
});
