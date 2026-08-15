import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes qui doivent rester ouvertes même quand SITE_PASSWORD est défini :
// des services externes (Stripe, Vercel Cron) qui ne connaissent pas ce mot
// de passe.
const PUBLIC_PATHS = ["/api/stripe/webhook", "/api/cron/"];

function isSiteAuthorized(request: NextRequest): boolean {
  const password = process.env.SITE_PASSWORD;
  if (!password) return true; // pas de mot de passe configuré = site public

  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Basic ")) return false;

  const [, suppliedPassword] = atob(auth.slice(6)).split(":");
  return suppliedPassword === password;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  if (!isPublicPath && !isSiteAuthorized(request)) {
    return new NextResponse("Authentification requise", {
      status: 401,
      headers: { "WWW-Authenticate": 'Basic realm="Loupick"' },
    });
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon|apple-icon|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
