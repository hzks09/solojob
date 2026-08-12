import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant — voir .env.example (connexion Neon).");
}

const MAX_ATTEMPTS = 4;
const RETRY_DELAY_MS = [300, 800, 1500];

/**
 * Le tier gratuit Neon met la base en veille après inactivité : la première
 * requête qui la "réveille" peut échouer (timeout/connexion refusée) le temps
 * qu'elle redémarre (quelques secondes). Sans retry, ça fait planter toute
 * page qui interroge la base au premier chargement après une pause.
 */
async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.status >= 500 && attempt < MAX_ATTEMPTS - 1) {
        lastError = new Error(`Neon a répondu ${res.status}`);
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS[attempt]));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS[attempt]));
      }
    }
  }

  throw lastError;
}

neonConfig.fetchFunction = fetchWithRetry;

const sql = neon(process.env.DATABASE_URL);

/**
 * Client Drizzle (driver HTTP Neon) — sans connexion persistante, idéal en
 * environnement serverless/edge. Chaque requête est un appel HTTP indépendant :
 * pour les opérations qui doivent être atomiques (ex. décrément de crédits),
 * utiliser une seule requête SQL (CTE) plutôt qu'une transaction multi-requêtes.
 * Voir `consumeCredits` dans `src/lib/db/credits.ts`.
 */
export const db = drizzle(sql, { schema });

export { schema };
