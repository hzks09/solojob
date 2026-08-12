import { defineConfig } from "drizzle-kit";

// drizzle-kit est un CLI indépendant de Next.js : il faut charger .env.local à la main.
try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local absent (ex. en CI où DATABASE_URL est déjà dans l'environnement)
}

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL manquant — voir .env.example");
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  strict: true,
  verbose: true,
});
