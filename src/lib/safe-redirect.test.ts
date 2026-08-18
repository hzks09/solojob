import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "./safe-redirect";

/**
 * Ces tests couvrent une faille de redirection ouverte corrigée par le passé :
 * un `callbackUrl` contrôlé par l'attaquant renvoyait la victime vers un site
 * externe après connexion. Ils sont là pour que la régression se voie
 * immédiatement.
 */
describe("safeRedirectPath", () => {
  it("accepte un chemin interne relatif", () => {
    expect(safeRedirectPath("/dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("/liste?filtre=court")).toBe("/liste?filtre=court");
  });

  it("retombe sur la valeur par défaut quand rien n'est fourni", () => {
    expect(safeRedirectPath(null)).toBe("/dashboard");
    expect(safeRedirectPath(undefined)).toBe("/dashboard");
    expect(safeRedirectPath("")).toBe("/dashboard");
  });

  it("respecte la valeur de repli personnalisée", () => {
    expect(safeRedirectPath(null, "/liste")).toBe("/liste");
  });

  it("rejette une URL absolue", () => {
    expect(safeRedirectPath("https://evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("http://evil.com/x")).toBe("/dashboard");
  });

  it("rejette une URL protocole-relative", () => {
    // "//evil.com" est interprété par le navigateur comme "https://evil.com".
    expect(safeRedirectPath("//evil.com")).toBe("/dashboard");
    expect(safeRedirectPath("//evil.com/path")).toBe("/dashboard");
  });

  it("rejette un chemin contenant :// ailleurs qu'au début", () => {
    expect(safeRedirectPath("/redir?to=https://evil.com")).toBe("/dashboard");
  });

  it("rejette ce qui ne commence pas par /", () => {
    expect(safeRedirectPath("dashboard")).toBe("/dashboard");
    expect(safeRedirectPath("javascript:alert(1)")).toBe("/dashboard");
  });

  it("accepte un chemin contenant @ (le préfixe seul détermine la cible)", () => {
    // "/x@evil.com" reste un chemin du site : le navigateur ne le traite pas
    // comme une autorité, contrairement à "//x@evil.com" (déjà rejeté ci-dessus).
    expect(safeRedirectPath("/x@evil.com")).toBe("/x@evil.com");
  });
});
