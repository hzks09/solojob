import { z } from "zod";

export const ligneSchema = z.object({
  description: z.string().trim().min(1, "Description requise").max(200),
  quantite: z.coerce.number().positive("Doit être positif"),
  prixUnitaire: z.coerce.number().min(0, "Ne peut pas être négatif"),
});

export const devisSchema = z.object({
  clientId: z.string().uuid("Choisis un client"),
  dateValidite: z.string().optional().or(z.literal("")),
  lignes: z.array(ligneSchema).min(1, "Ajoute au moins une ligne"),
});

export type LigneInput = z.infer<typeof ligneSchema>;
export type DevisInput = z.infer<typeof devisSchema>;

export function computeTotal(lignes: LigneInput[]): number {
  return lignes.reduce((sum, l) => sum + l.quantite * l.prixUnitaire, 0);
}
