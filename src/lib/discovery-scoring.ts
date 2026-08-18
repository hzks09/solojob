/**
 * Logique de scoring pure de la découverte, séparée de `actions/discovery.ts`.
 *
 * Deux raisons à ce fichier : `actions/discovery.ts` porte la directive
 * `"use server"`, qui impose que **tout** export soit une fonction asynchrone —
 * une constante ou un calcul synchrone n'y est donc pas exportable. Et isoler
 * ces règles du code qui parle à la base les rend testables directement, sans
 * mock.
 */

// Part des propositions qui ignorent complètement le score appris pour piocher
// parmi les tags les moins explorés. Sans ça, le score appris ne fait que
// renforcer les tags choisis à l'onboarding et l'utilisateur ne découvre jamais
// de nouvelles catégories. Plus élevée pour un nouveau compte (peu de signal
// appris, donc plus de découverte), puis se resserre linéairement jusqu'au
// seuil ci-dessous une fois le goût mieux cerné.
export const EXPLORATION_RATE_NEW = 0.3;
export const EXPLORATION_RATE_ESTABLISHED = 0.12;
export const EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES = 50;

/**
 * Taux d'exploration en fonction du nombre de swipes déjà effectués :
 * interpolation linéaire de EXPLORATION_RATE_NEW vers
 * EXPLORATION_RATE_ESTABLISHED, puis constant au-delà du seuil.
 */
export function explorationRateFor(totalSwipes: number): number {
  // Un compte sans historique (ou une valeur aberrante) part du taux de
  // découverte maximal plutôt que de produire un taux extrapolé hors bornes.
  if (!Number.isFinite(totalSwipes) || totalSwipes <= 0) return EXPLORATION_RATE_NEW;
  if (totalSwipes >= EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES) return EXPLORATION_RATE_ESTABLISHED;

  const progress = totalSwipes / EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES;
  return EXPLORATION_RATE_NEW + (EXPLORATION_RATE_ESTABLISHED - EXPLORATION_RATE_NEW) * progress;
}
