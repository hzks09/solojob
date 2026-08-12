/** "en_retard" n'est jamais stocké en base : calculé ici à la volée. */
export function isEnRetard(facture: { statut: string; dateEcheance: string | null }): boolean {
  if (facture.statut !== "envoyee" || !facture.dateEcheance) return false;
  return new Date(facture.dateEcheance) < new Date(new Date().toDateString());
}
