import type { GenerationRequest } from "./provider";

/**
 * Construit le prompt texte envoyé au modèle IA à partir des options
 * structurées choisies par l'utilisateur (style, budget, couleurs...) ou de
 * sa description libre en mode "Designer IA" (`customPrompt`).
 */
export function buildPrompt(req: GenerationRequest): string {
  if (req.customPrompt?.trim()) {
    return `${req.customPrompt.trim()}. Préserve strictement la structure architecturale de la pièce (murs, fenêtres, portes, volumes) : ne modifie que l'aménagement, le mobilier et la décoration. Rendu photoréaliste.`;
  }

  const parts = [
    `Réaménage cette ${req.roomType} dans un style ${req.style}.`,
  ];

  if (req.dominantColors.length > 0) {
    parts.push(`Palette de couleurs dominantes : ${req.dominantColors.join(", ")}.`);
  }
  if (req.furnitureType) parts.push(`Mobilier privilégié : ${req.furnitureType}.`);
  if (req.materials) parts.push(`Matériaux : ${req.materials}.`);
  if (req.ambiance) parts.push(`Ambiance recherchée : ${req.ambiance}.`);

  const budgetLabel: Record<string, string> = {
    moins_500: "un budget de décoration inférieur à 500 €",
    moins_1000: "un budget de décoration inférieur à 1000 €",
    moins_3000: "un budget de décoration inférieur à 3000 €",
    illimite: "un budget de décoration illimité",
  };
  parts.push(`Adapte les propositions pour ${budgetLabel[req.budgetMode] ?? "un budget flexible"}.`);

  const levelLabel: Record<string, string> = {
    leger: "une transformation légère (retouches et petites touches déco)",
    modere: "une transformation modérée (nouvelle décoration, quelques meubles remplacés)",
    complet: "une transformation complète (réaménagement total)",
  };
  parts.push(`Niveau de transformation : ${levelLabel[req.transformationLevel] ?? "modéré"}.`);

  parts.push(
    "Préserve strictement la structure architecturale de la pièce (murs, fenêtres, portes, volumes, perspective) : ne modifie que l'aménagement, le mobilier et la décoration. Rendu photoréaliste, éclairage naturel cohérent."
  );

  return parts.join(" ");
}
