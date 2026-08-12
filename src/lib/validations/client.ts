import { z } from "zod";

export const clientSchema = z.object({
  nom: z.string().trim().min(1, "Le nom est requis").max(120),
  email: z.string().trim().toLowerCase().email("E-mail invalide").optional().or(z.literal("")),
  telephone: z.string().trim().max(30).optional().or(z.literal("")),
  adresse: z.string().trim().max(300).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export type ClientInput = z.infer<typeof clientSchema>;
