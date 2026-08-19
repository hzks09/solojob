import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { destinationForType, parseEmailLinkType } from "@/lib/auth/email-link";
import { reportAuthLinkFailure, type AuthLinkFailure } from "@/lib/auth/link-failure";

/**
 * Ancien point d'arrivée des liens Supabase Auth, en flux PKCE.
 *
 * Les nouveaux e-mails pointent vers `/auth/confirm` (voir ce fichier), mais
 * cette route reste nécessaire tant que des liens déjà envoyés dorment dans
 * des boîtes de réception. Elle sert aussi aux redirections OAuth, qui elles
 * repassent bien par le même navigateur.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = parseEmailLinkType(searchParams.get("type"));
  const next = destinationForType(type, searchParams.get("next"));

  const fail = (failure: AuthLinkFailure, context: Record<string, unknown> = {}) => {
    reportAuthLinkFailure(failure, { route: "/auth/callback", type: searchParams.get("type"), ...context });
    return NextResponse.redirect(`${origin}/login?error=lien_invalide&raison=${failure}`);
  };

  if (!code) return fail("parametres_absents", { codePresent: false });

  // Le `code-verifier` est déposé dans le navigateur au moment de
  // l'inscription : s'il manque, le lien a été ouvert ailleurs (e-mail relevé
  // sur le téléphone, aperçu d'un client mail). L'échange échouerait avec un
  // message opaque — autant nommer la cause tout de suite.
  const cookieStore = await cookies();
  const hasVerifier = cookieStore.getAll().some((cookie) => cookie.name.includes("code-verifier"));
  if (!hasVerifier) return fail("verificateur_absent");

  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return fail("echange_refuse", { message: error.message, status: error.status });
    }
  } catch (cause) {
    // Un blip réseau vers l'API Auth ne doit pas produire une 500 brute.
    return fail("appel_impossible", { message: String(cause) });
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  // Cookie court terme lu par ConfirmedToast (voir (app)/layout.tsx) — évite
  // de propager un paramètre `?confirmed=1` qui se perdrait si la page
  // suivante redirige elle-même (ex. dashboard -> onboarding).
  if (type === "signup") {
    response.cookies.set("just_confirmed", "1", { path: "/", maxAge: 30 });
  }
  return response;
}
