import type { PlanTier } from "@/lib/db/schema";

export const FREE_PLAN_MONTHLY_FACTURE_LIMIT = 3;

export interface PlanConfig {
  tier: PlanTier;
  name: string;
  priceMonthly: number;
  factureLimit: number | "illimite";
  relancesAutomatiques: boolean;
  paiementEnLigne: boolean;
  facturesRecurrentes: boolean;
  notesDeFrais: boolean;
  features: string[];
}

export const PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    tier: "free",
    name: "Gratuit",
    priceMonthly: 0,
    factureLimit: FREE_PLAN_MONTHLY_FACTURE_LIMIT,
    relancesAutomatiques: false,
    paiementEnLigne: false,
    facturesRecurrentes: false,
    notesDeFrais: false,
    features: ["3 factures par mois", "Devis illimités", "PDF pro avec ton logo"],
  },
  solo: {
    tier: "solo",
    name: "Solo",
    priceMonthly: 12,
    factureLimit: "illimite",
    relancesAutomatiques: true,
    paiementEnLigne: true,
    facturesRecurrentes: false,
    notesDeFrais: false,
    features: ["Facturation illimitée", "Relances automatiques", "Paiement en ligne"],
  },
  solo_plus: {
    tier: "solo_plus",
    name: "Solo+",
    priceMonthly: 19,
    factureLimit: "illimite",
    relancesAutomatiques: true,
    paiementEnLigne: true,
    // Facturation récurrente, notes de frais et demandes d'avis automatiques
    // sont sur la feuille de route mais pas encore construites — ne pas les
    // remettre dans `features` avant qu'elles existent vraiment.
    facturesRecurrentes: false,
    notesDeFrais: false,
    features: ["Tout Solo"],
  },
};
