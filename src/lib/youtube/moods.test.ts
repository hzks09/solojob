import { describe, expect, it } from "vitest";
import { MOOD_CATEGORIES } from "./moods";

/**
 * Ce fichier ne teste pas du code mais l'intégrité des données : une collision
 * de tags entre deux catégories casserait silencieusement le score appris
 * (userTagWeights est indexé par tag, sans notion de catégorie d'origine),
 * sans jamais lever d'erreur.
 */
describe("MOOD_CATEGORIES", () => {
  const allTags = MOOD_CATEGORIES.flatMap((mood) => [mood.tag, ...mood.subCategories.map((sub) => sub.tag)]);

  it("n'a aucun tag en double, toutes catégories et sous-catégories confondues", () => {
    const duplicates = allTags.filter((tag, index) => allTags.indexOf(tag) !== index);
    expect(duplicates).toEqual([]);
  });

  it("définit au moins une catégorie", () => {
    expect(MOOD_CATEGORIES.length).toBeGreaterThan(0);
  });

  it("donne à chaque catégorie au moins une formulation de recherche", () => {
    for (const mood of MOOD_CATEGORIES) {
      expect(mood.searchQueries.length, `catégorie « ${mood.tag} »`).toBeGreaterThan(0);
    }
  });

  it("donne à chaque catégorie au moins une sous-catégorie", () => {
    for (const mood of MOOD_CATEGORIES) {
      expect(mood.subCategories.length, `catégorie « ${mood.tag} »`).toBeGreaterThan(0);
    }
  });

  it("n'a ni tag, ni libellé, ni formulation vide", () => {
    for (const mood of MOOD_CATEGORIES) {
      expect(mood.tag.trim(), "tag de catégorie").not.toBe("");
      expect(mood.label.trim(), `libellé de « ${mood.tag} »`).not.toBe("");
      for (const query of mood.searchQueries) {
        expect(query.trim(), `formulation de « ${mood.tag} »`).not.toBe("");
      }
      for (const sub of mood.subCategories) {
        expect(sub.tag.trim(), `tag de sous-catégorie de « ${mood.tag} »`).not.toBe("");
        expect(sub.label.trim(), `libellé de « ${sub.tag} »`).not.toBe("");
      }
    }
  });

  it("n'a aucun mot-clé de détection vide", () => {
    // Une chaîne vide est contenue dans n'importe quel titre : elle ferait
    // correspondre la sous-catégorie à absolument toutes les vidéos.
    for (const mood of MOOD_CATEGORIES) {
      for (const sub of mood.subCategories) {
        expect(sub.matchKeywords.length, `sous-catégorie « ${sub.tag} »`).toBeGreaterThan(0);
        for (const keyword of sub.matchKeywords) {
          expect(keyword.trim(), `mot-clé de « ${sub.tag} »`).not.toBe("");
        }
      }
    }
  });

  it("n'a aucune formulation de recherche en double", () => {
    const queries = MOOD_CATEGORIES.flatMap((mood) => mood.searchQueries);
    const duplicates = queries.filter((q, i) => queries.indexOf(q) !== i);
    expect(duplicates).toEqual([]);
  });

  it("ne réintroduit pas de catégorie musicale (choix éditorial du site)", () => {
    expect(allTags).not.toContain("musique");
  });
});
