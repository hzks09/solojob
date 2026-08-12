import { z } from "zod";

export const createGenerationSchema = z.object({
  projectId: z.string().min(1),
  imageUrl: z.string().url(),
  roomType: z.enum(["salon", "chambre", "cuisine", "salle_de_bain", "bureau", "jardin"]),
  style: z.string().min(1).max(50),
  budgetMode: z.enum(["moins_500", "moins_1000", "moins_3000", "illimite"]).default("illimite"),
  dominantColors: z.array(z.string().max(30)).max(6).default([]),
  furnitureType: z.string().max(200).optional(),
  materials: z.string().max(200).optional(),
  ambiance: z.string().max(200).optional(),
  transformationLevel: z.enum(["leger", "modere", "complet"]).default("modere"),
  customPrompt: z.string().max(1000).optional(),
  quality: z.enum(["standard", "hd", "ultra_hd"]).default("standard"),
});

export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
