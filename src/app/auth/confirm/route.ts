import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { destinationForType, parseEmailLinkType } from "@/lib/auth/email-link";
import { reportAuthLinkFailure, type AuthLinkFailure } from "@/lib/auth/link-failure";

/**
 * Point d'arrivée des liens e-mail Supabase Auth (confirmation d'inscription,
 * réinitialisation de mot de passe).
 *
 * Contrairement à `/auth/callback` (flux PKCE), `verifyOtp` ne réclame aucun
 * cookie déposé au moment de l'inscription : le lien fonctionne donc depuis
 * n'importe quel navigateur. C'est exactement le cas de figure du testeur qui
 * s'inscrit sur son ordinateur et ouvre l'e-mail sur son téléphone — le flux
 * PKCE échouait là, faute de `code-verifier` sous la main.
 *
 * Gabarits d'e-mail correspondants (tableau de bord Supabase → Auth →
 * Email Templates) :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const rawType = searchParams.get("type");
  const type = parseEmailLinkType(rawType);

  const fail = (failure: AuthLinkFailure, context: Record<string, unknown> = {}) => {
    reportAuthLinkFailure(failure, { route: "/auth/confirm", type: rawType, ...context });
    return NextResponse.redirect(`${origin}/login?error=lien_invalide&raison=${failure}`);
  };

  if (!tokenHash) return fail("parametres_absents", { tokenHashPresent: false });
  if (!type) return fail("type_inconnu");

  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (error) {
      return fail("verification_refusee", { message: error.message, status: error.status });
    }
  } catch (cause) {
    // Un blip réseau vers l'API Auth ne doit pas produire une 500 brute.
    return fail("appel_impossible", { message: String(cause) });
  }

  const response = NextResponse.redirect(`${origin}${destinationForType(type, searchParams.get("next"))}`);
  // Cookie court terme lu par ConfirmedToast (voir (app)/layout.tsx) — évite
  // de propager un paramètre `?confirmed=1` qui se perdrait si la page
  // suivante redirige elle-même (ex. dashboard -> onboarding).
  if (type === "signup") {
    response.cookies.set("just_confirmed", "1", { path: "/", maxAge: 30 });
  }
  return response;
}
