import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant — chaîne de connexion Postgres Supabase (voir .env.example).");
}

/**
 * Le pooler Supabase (mode "Session", tier gratuit) limite à 15 connexions
 * simultanées côté serveur. `postgres-js` ouvre son propre sous-pool (10 par
 * défaut) à chaque instanciation — en dev, le hot-reload de Next.js peut en
 * recréer plusieurs sans fermer les précédentes et épuiser ce quota très vite.
 * Deux garde-fous : un pool local minimal (`max: 1`, Supabase pool déjà en
 * amont) et un cache sur `globalThis` pour survivre au Hot Module Replacement.
 */
const globalForDb = globalThis as unknown as { __dbClient?: ReturnType<typeof postgres> };

const client =
  globalForDb.__dbClient ??
  postgres(process.env.DATABASE_URL, { prepare: false, max: 1, idle_timeout: 20 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__dbClient = client;
}

/**
 * Client Drizzle connecté à la base Postgres Supabase. Supabase gère
 * l'authentification séparément (`auth.users`, via @supabase/ssr) — Drizzle
 * ne touche qu'aux tables métier du schéma `public`.
 */
export const db = drizzle(client, { schema });

export { schema };
