/**
 * N'accepte qu'un chemin interne relatif (ex. "/dashboard") — rejette toute
 * URL absolue, protocole-relative ("//...") ou contenant "://", pour empêcher
 * une redirection ouverte via un paramètre contrôlé par l'utilisateur
 * (callbackUrl, next, etc.).
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) return fallback;
  return raw;
}
