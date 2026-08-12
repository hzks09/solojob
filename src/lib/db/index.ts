import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant — chaîne de connexion Postgres Supabase (voir .env.example).");
}

const client = postgres(process.env.DATABASE_URL, { prepare: false });

/**
 * Client Drizzle connecté à la base Postgres Supabase. Supabase gère
 * l'authentification séparément (`auth.users`, via @supabase/ssr) — Drizzle
 * ne touche qu'aux tables métier du schéma `public`.
 */
export const db = drizzle(client, { schema });

export { schema };
