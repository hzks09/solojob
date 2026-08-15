import { z } from "zod";

export const profileSchema = z
  .object({
    fullName: z.string().trim().max(120).optional().or(z.literal("")),
    companyName: z.string().trim().max(120).optional().or(z.literal("")),
    siret: z
      .string()
      .trim()
      .regex(/^\d{14}$/, "Le SIRET doit comporter exactement 14 chiffres")
      .optional()
      .or(z.literal("")),
    adresse: z.string().trim().max(200).optional().or(z.literal("")),
    codePostal: z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Le code postal doit comporter 5 chiffres")
      .optional()
      .or(z.literal("")),
    ville: z.string().trim().max(100).optional().or(z.literal("")),
    tvaApplicable: z.boolean().optional(),
    numeroTva: z.string().trim().max(30).optional().or(z.literal("")),
    iban: z.string().trim().max(34).optional().or(z.literal("")),
  })
  .refine((data) => !data.tvaApplicable || (data.numeroTva && data.numeroTva.trim().length > 0), {
    message: "Renseigne ton numéro de TVA intracommunautaire, ou décoche la case TVA applicable",
    path: ["numeroTva"],
  });

export type ProfileInput = z.infer<typeof profileSchema>;
