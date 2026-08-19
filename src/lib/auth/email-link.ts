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
 * Destination après vérification du lien. Un lien de réinitialisation doit
 * atterrir sur le formulaire de nouveau mot de passe même quand l'e-mail ne
 * porte pas de `next` — sinon l'utilisateur arrive connecté sur le dashboard
 * sans jamais avoir choisi son mot de passe.
 */
export function destinationForType(
  type: EmailLinkType | null,
  next: string | null | undefined
): string {
  if (type === "recovery") return safeRedirectPath(next, "/reset-password");
  return safeRedirectPath(next);
}
