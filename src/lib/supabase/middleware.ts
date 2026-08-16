import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rappel : toute nouvelle route sous (app) doit être ajoutée ici. Ces routes
// sont déjà protégées en profondeur au niveau des Server Actions
// (getCurrentUser()/requireAdmin()), mais sans cette liste un visiteur non
// connecté obtient un rendu serveur inutile au lieu d'une redirection propre
// vers /login.
const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/liste", "/settings", "/billing", "/suggestions", "/admin"];

/**
 * Rafraîchit la session Supabase (cookies) à chaque requête et redirige vers
 * /login si une route protégée est visitée sans session valide.
 * Pattern standard @supabase/ssr pour Next.js App Router.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options));
        },
      },
    }
  );

  // Un ralentissement réseau ponctuel vers l'API Auth Supabase ne doit pas
  // faire planter toute la requête — un essai suffit presque toujours à
  // absorber ce type de blip. En dernier recours, on laisse passer : la
  // page elle-même revérifie via getCurrentUser() (voir commentaire ci-dessus).
  let user = null;
  try {
    user = (await supabase.auth.getUser()).data.user;
  } catch {
    try {
      user = (await supabase.auth.getUser()).data.user;
    } catch {
      return supabaseResponse;
    }
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
