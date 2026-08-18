import type { PlanTier } from "@/lib/db/schema";

export const FREE_PLAN_DAILY_DISCOVERY_LIMIT = 20;

/**
 * Préfixes des routes réservées aux utilisateurs connectés. Source unique
 * partagée entre le middleware (qui redirige vers /login) et robots.ts (qui
 * les exclut de l'indexation) : les deux listes ayant divergé par le passé,
 * toute nouvelle route sous (app) doit être ajoutée ici et nulle part ailleurs.
 */
export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/liste",
  "/settings",
  "/billing",
  "/suggestions",
  "/admin",
] as const;

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  dailyDiscoveryLimit: number | "illimite";
  advancedFilters: boolean;
  features: string[];
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: "free",
    name: "Gratuit",
    priceMonthly: 0,
    dailyDiscoveryLimit: FREE_PLAN_DAILY_DISCOVERY_LIMIT,
    advancedFilters: false,
    features: [`${FREE_PLAN_DAILY_DISCOVERY_LIMIT} découvertes par jour`, "Liste à regarder plus tard"],
  },
  solo: {
    tier: "solo",
    name: "Loupick+",
    priceMonthly: 4,
    dailyDiscoveryLimit: "illimite",
    advancedFilters: true,
    features: ["Découvertes illimitées", "Filtres avancés (durée, langue)", "Liste à regarder plus tard"],
  },
  // Dormant — pas de forfait au-dessus de Loupick+ pour l'instant, masqué
  // de l'affichage public (voir PUBLIC_PLAN_TIERS).
  solo_plus: {
    tier: "solo_plus",
    name: "Loupick+",
    priceMonthly: 19,
    dailyDiscoveryLimit: "illimite",
    advancedFilters: true,
    features: ["Découvertes illimitées", "Filtres avancés (durée, langue)", "Liste à regarder plus tard"],
  },
};

export const PUBLIC_PLAN_TIERS: PlanTier[] = ["free", "solo"];
