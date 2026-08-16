/**
 * Rate limiting — store en mémoire par défaut (100% gratuit, aucune
 * dépendance externe), suffisant en dev / déploiement single-instance. En
 * production multi-instance (plusieurs régions/instances serverless
 * concurrentes), l'état en mémoire n'est pas partagé entre instances : un
 * attaquant qui parallélise ses requêtes peut dépasser la limite réelle en
 * pratique.
 *
 * Si `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` sont définis, la
 * limite est appliquée via Upstash Redis (tier gratuit disponible), partagé
 * entre toutes les instances — sinon dégradation silencieuse vers le store en
 * mémoire, même logique que Resend/Sentry/YouTube quand une clé optionnelle
 * manque.
 */

import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

type LimitResult = { success: boolean; remaining: number };

const store = new Map<string, number[]>();

// Purge périodique pour éviter une fuite mémoire sur les clés inactives.
const MAX_TRACKED_KEYS = 10_000;

function memoryRateLimit(key: string, limit: number, windowMs: number): LimitResult {
  const now = Date.now();
  const timestamps = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  timestamps.push(now);
  store.set(key, timestamps);

  if (store.size > MAX_TRACKED_KEYS) {
    const oldestKey = store.keys().next().value;
    if (oldestKey) store.delete(oldestKey);
  }

  return { success: timestamps.length <= limit, remaining: Math.max(0, limit - timestamps.length) };
}

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;

// `Ratelimit.slidingWindow` fige (limit, windowMs) à la construction, alors
// que `rateLimit()` accepte des paramètres différents à chaque site d'appel
// — une instance est donc mise en cache par combinaison rencontrée.
const ratelimiters = new Map<string, Ratelimit>();

function getRatelimiter(limit: number, windowMs: number): Ratelimit {
  const cacheKey = `${limit}:${windowMs}`;
  let limiter = ratelimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: false,
      prefix: "loupick-ratelimit",
    });
    ratelimiters.set(cacheKey, limiter);
  }
  return limiter;
}

/** Limite par `limit` requêtes par fenêtre glissante `windowMs`, par clé (userId ou IP). */
export async function rateLimit(key: string, limit = 20, windowMs = 60_000): Promise<LimitResult> {
  if (!redis) return memoryRateLimit(key, limit, windowMs);

  try {
    const { success, remaining } = await getRatelimiter(limit, windowMs).limit(key);
    return { success, remaining };
  } catch {
    // Redis injoignable : on ne bloque jamais une requête légitime à cause
    // d'une panne du store de rate limiting — repli sur le store en mémoire.
    return memoryRateLimit(key, limit, windowMs);
  }
}
