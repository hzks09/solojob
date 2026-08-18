import { describe, expect, it } from "vitest";
import {
  EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES,
  EXPLORATION_RATE_ESTABLISHED,
  EXPLORATION_RATE_NEW,
  explorationRateFor,
} from "./discovery-scoring";

describe("explorationRateFor", () => {
  it("part du taux de découverte maximal pour un compte neuf", () => {
    expect(explorationRateFor(0)).toBe(EXPLORATION_RATE_NEW);
  });

  it("se stabilise au taux établi une fois le seuil atteint", () => {
    expect(explorationRateFor(EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES)).toBe(EXPLORATION_RATE_ESTABLISHED);
    expect(explorationRateFor(EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES + 500)).toBe(EXPLORATION_RATE_ESTABLISHED);
  });

  it("interpole linéairement entre les deux bornes", () => {
    const midpoint = explorationRateFor(EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES / 2);
    expect(midpoint).toBeCloseTo((EXPLORATION_RATE_NEW + EXPLORATION_RATE_ESTABLISHED) / 2, 10);
  });

  it("décroît de façon monotone jusqu'au seuil", () => {
    let previous = explorationRateFor(0);
    for (let swipes = 1; swipes <= EXPLORATION_ADAPTIVE_THRESHOLD_SWIPES; swipes++) {
      const current = explorationRateFor(swipes);
      expect(current).toBeLessThanOrEqual(previous);
      previous = current;
    }
  });

  it("reste toujours dans les bornes attendues", () => {
    for (const swipes of [0, 1, 7, 25, 49, 50, 1000]) {
      const rate = explorationRateFor(swipes);
      expect(rate).toBeGreaterThanOrEqual(EXPLORATION_RATE_ESTABLISHED);
      expect(rate).toBeLessThanOrEqual(EXPLORATION_RATE_NEW);
    }
  });

  it("ne produit pas de taux extrapolé sur une entrée aberrante", () => {
    expect(explorationRateFor(-10)).toBe(EXPLORATION_RATE_NEW);
    expect(explorationRateFor(Number.NaN)).toBe(EXPLORATION_RATE_NEW);
  });
});
