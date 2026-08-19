import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Types de liens e-mail émis par Supabase Auth. Le paramètre `type` de l'URL
 * vient de l'extérieur : il est validé contre cette liste avant d'être passé à
 * `verifyOtp`, jamais transmis tel quel.
 */
export const EMAIL_LINK_TYPES = [
  "signup",
  "recovery",
  "invite",
  "email_change",
  "magiclink",
  "email",
] as const;

export type EmailLinkType = (typeof EMAIL_LINK_TYPES)[number];

export function parseEmailLinkType(raw: string | null | undefined): EmailLinkType | null {
  if (!raw) return null;
  return (EMAIL_LINK_TYPES as readonly string[]).includes(raw) ? (raw as EmailLinkType) : null;
}

/**
 * Destination après vérification du lien, quand l'e-mail ne porte pas de
 * `next` :
 * - `recovery` doit atterrir sur le formulaire de nouveau mot de passe, sinon
 *   l'utilisateur arrive connecté sans jamais avoir choisi son mot de passe ;
 * - `email_change` doit revenir sur le profil, d'où le changement a été
 *   demandé, pour que la nouvelle adresse s'affiche.
 */
const DEFAULT_DESTINATIONS: Partial<Record<EmailLinkType, string>> = {
  recovery: "/reset-password",
  email_change: "/settings",
};

export function destinationForType(
  type: EmailLinkType | null,
  next: string | null | undefined
): string {
  const fallback = type ? DEFAULT_DESTINATIONS[type] : undefined;
  return fallback ? safeRedirectPath(next, fallback) : safeRedirectPath(next);
}
