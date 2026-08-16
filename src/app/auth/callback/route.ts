import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeRedirectPath } from "@/lib/safe-redirect";

/**
 * Point d'arrivée des liens envoyés par Supabase Auth (confirmation
 * d'inscription, réinitialisation de mot de passe). Échange le code contre
 * une session, puis redirige vers `next` (par défaut le dashboard).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const response = NextResponse.redirect(`${origin}${next}`);
      // Cookie court terme lu par ConfirmedToast (voir (app)/layout.tsx) — évite
      // de propager un paramètre `?confirmed=1` qui se perdrait si la page
      // suivante redirige elle-même (ex. dashboard -> onboarding).
      if (type === "signup") {
        response.cookies.set("just_confirmed", "1", { path: "/", maxAge: 30 });
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=lien_invalide`);
}
