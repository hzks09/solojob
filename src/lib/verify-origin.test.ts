import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isTrustedOrigin } from "./verify-origin";

function requestWith(headers: Record<string, string>): Request {
  return new Request("https://loupick.app/api/stripe/checkout", { method: "POST", headers });
}

describe("isTrustedOrigin", () => {
  const original = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = "https://loupick.app";
  });

  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = original;
  });

  it("accepte une origine identique à NEXT_PUBLIC_APP_URL", () => {
    expect(isTrustedOrigin(requestWith({ origin: "https://loupick.app" }))).toBe(true);
  });

  it("compare l'origine, pas l'URL complète", () => {
    expect(isTrustedOrigin(requestWith({ origin: "https://loupick.app/une/page" }))).toBe(true);
  });

  it("rejette une origine différente", () => {
    expect(isTrustedOrigin(requestWith({ origin: "https://evil.com" }))).toBe(false);
  });

  it("rejette un sous-domaine non prévu", () => {
    expect(isTrustedOrigin(requestWith({ origin: "https://attaquant.loupick.app" }))).toBe(false);
  });

  it("rejette le même hôte sur un autre protocole", () => {
    expect(isTrustedOrigin(requestWith({ origin: "http://loupick.app" }))).toBe(false);
  });

  it("utilise Referer en repli quand Origin est absent", () => {
    expect(isTrustedOrigin(requestWith({ referer: "https://loupick.app/billing" }))).toBe(true);
    expect(isTrustedOrigin(requestWith({ referer: "https://evil.com/x" }))).toBe(false);
  });

  it("rejette quand aucun en-tête d'origine n'est présent", () => {
    expect(isTrustedOrigin(requestWith({}))).toBe(false);
  });

  it("rejette quand NEXT_PUBLIC_APP_URL n'est pas configuré", () => {
    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(isTrustedOrigin(requestWith({ origin: "https://loupick.app" }))).toBe(false);
  });

  it("rejette une origine syntaxiquement invalide", () => {
    expect(isTrustedOrigin(requestWith({ origin: "pas-une-url" }))).toBe(false);
  });
});
