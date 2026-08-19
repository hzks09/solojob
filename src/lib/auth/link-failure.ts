import * as Sentry from "@sentry/nextjs";

/**
 * Raisons pour lesquelles un lien e-mail peut être refusé. Elles voyagent
 * jusqu'à `/login?error=lien_invalide&raison=...` : côté utilisateur pour
 * afficher un message qui dit quoi faire, côté logs pour savoir laquelle des
 * causes possibles s'est réellement produite — sans ça, tous les échecs se
 * ressemblent et le diagnostic se fait à l'aveugle.
 */
export type AuthLinkFailure =
  | "parametres_absents"
  | "type_inconnu"
  | "verification_refusee"
  | "verificateur_absent"
  | "echange_refuse"
  | "appel_impossible";

/**
 * `console.error` en plus de Sentry : le SDK reste inactif tant que
 * SENTRY_DSN n'est pas défini (voir sentry.server.config.ts), alors que les
 * logs de fonction Vercel, eux, sont toujours là.
 */
export function reportAuthLinkFailure(failure: AuthLinkFailure, context: Record<string, unknown>) {
  console.error(`[auth] lien e-mail refusé (${failure})`, context);
  Sentry.captureMessage(`Lien e-mail refusé : ${failure}`, {
    level: "warning",
    extra: context,
  });
}
