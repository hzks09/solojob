import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'arrivée des liens envoyés par Supabase Auth (confirmation
 * d'inscription, réinitialisation de mot de passe). Échange le code contre
 * une session, puis redirige vers `next` (par défaut le dashboard).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=lien_invalide`);
}
