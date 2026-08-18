import { defineConfig } from "vitest/config";

/**
 * Tests unitaires de la logique pure : pas de base de données, pas de rendu de
 * composant. La résolution des imports `@/...` est assurée nativement par Vite
 * à partir de tsconfig.json, donc sans greffon ni table d'alias dupliquée ici.
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Les tests de rate limiting manipulent le temps et un store de portée
    // module : les séquencer évite qu'une exécution parallèle ne fausse une
    // fenêtre glissante.
    sequence: { concurrent: false },
  },
});
