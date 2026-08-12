/**
 * Rate limiting en mémoire — 100% gratuit, aucune dépendance externe.
 * Suffisant en dev / déploiement single-instance. En production multi-instance
 * (plusieurs régions/instances serverless concurrentes), remplacer par un
 * store partagé (ex. Upstash Redis, tier gratuit disponible) : l'état en
 * mémoire n'est pas partagé entre instances.
 */

type LimitResult = { success: boolean; remaining: number };

const store = new Map<string, number[]>();

// Purge périodique pour éviter une fuite mémoire sur les clés inactives.
const MAX_TRACKED_KEYS = 10_000;

/** Limite par défaut : `limit` requêtes par fenêtre glissante `windowMs`, par clé (userId ou IP). */
export function rateLimit(key: string, limit = 20, windowMs = 60_000): LimitResult {
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
