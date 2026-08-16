/**
 * Vérification d'origine en défense en profondeur CSRF pour les Route
 * Handlers authentifiés par cookie (contrairement aux Server Actions Next,
 * qui ont une vérification d'origine intégrée). Compare `Origin` (à défaut
 * `Referer`) à `NEXT_PUBLIC_APP_URL` — rejette si absent ou incohérent.
 */
export function isTrustedOrigin(req: Request): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return false;

  const origin = req.headers.get("origin") ?? req.headers.get("referer");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}
