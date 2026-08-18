import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Sans UPSTASH_REDIS_REST_URL/TOKEN dans l'environnement, `rateLimit()` utilise
 * le store en mémoire — c'est ce chemin qui est testé ici (et c'est celui
 * réellement actif en production tant qu'Upstash n'est pas configuré).
 */
describe("rateLimit (store en mémoire)", () => {
  let rateLimit: typeof import("./rate-limit").rateLimit;

  beforeEach(async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    // Module rechargé à chaque test : le store est un Map de portée module,
    // sinon les compteurs fuiteraient d'un test à l'autre.
    vi.resetModules();
    ({ rateLimit } = await import("./rate-limit"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("laisse passer tant que la limite n'est pas atteinte", async () => {
    expect((await rateLimit("cle-a", 3, 60_000)).success).toBe(true);
    expect((await rateLimit("cle-a", 3, 60_000)).success).toBe(true);
    expect((await rateLimit("cle-a", 3, 60_000)).success).toBe(true);
  });

  it("bloque au-delà de la limite", async () => {
    for (let i = 0; i < 3; i++) await rateLimit("cle-b", 3, 60_000);
    expect((await rateLimit("cle-b", 3, 60_000)).success).toBe(false);
  });

  it("décrémente `remaining` à chaque appel", async () => {
    expect((await rateLimit("cle-c", 3, 60_000)).remaining).toBe(2);
    expect((await rateLimit("cle-c", 3, 60_000)).remaining).toBe(1);
    expect((await rateLimit("cle-c", 3, 60_000)).remaining).toBe(0);
    // Ne descend jamais sous zéro, même en dépassement.
    expect((await rateLimit("cle-c", 3, 60_000)).remaining).toBe(0);
  });

  it("compte les clés indépendamment les unes des autres", async () => {
    for (let i = 0; i < 3; i++) await rateLimit("utilisateur-1", 3, 60_000);
    expect((await rateLimit("utilisateur-1", 3, 60_000)).success).toBe(false);
    expect((await rateLimit("utilisateur-2", 3, 60_000)).success).toBe(true);
  });

  it("libère la limite une fois la fenêtre glissante écoulée", async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) await rateLimit("cle-d", 3, 60_000);
    expect((await rateLimit("cle-d", 3, 60_000)).success).toBe(false);

    vi.advanceTimersByTime(60_001);
    expect((await rateLimit("cle-d", 3, 60_000)).success).toBe(true);
  });

  it("ne libère pas la limite avant la fin de la fenêtre", async () => {
    vi.useFakeTimers();
    for (let i = 0; i < 3; i++) await rateLimit("cle-e", 3, 60_000);

    vi.advanceTimersByTime(59_000);
    expect((await rateLimit("cle-e", 3, 60_000)).success).toBe(false);
  });

  it("borne la mémoire : le store ne grossit pas indéfiniment", async () => {
    // MAX_TRACKED_KEYS vaut 10 000 ; on insère au-delà et on vérifie que les
    // clés les plus anciennes sont évincées au lieu de fuir.
    for (let i = 0; i < 10_200; i++) await rateLimit(`cle-purge-${i}`, 5, 60_000);

    // La première clé insérée doit avoir été évincée : son compteur repart à
    // zéro, donc `remaining` vaut limite-1 comme pour une clé neuve.
    expect((await rateLimit("cle-purge-0", 5, 60_000)).remaining).toBe(4);
  });
});
