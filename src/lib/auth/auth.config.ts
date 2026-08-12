import type { NextAuthConfig } from "next-auth";

/**
 * Config "edge-safe" : aucune dépendance à l'adapter Drizzle ni à bcrypt.
 * Utilisée telle quelle par le middleware (runtime Edge) pour les redirections
 * d'accès ; complétée par les providers + l'adapter dans `auth.ts` pour le
 * runtime Node (route handler /api/auth/[...nextauth]).
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    // Recopie role/plan/id du token (déjà présents dans le JWT signé depuis la
    // connexion) vers `session.user` — utilisé aussi bien par le middleware
    // (edge) que par la config complète, qui n'a donc pas besoin de le redéfinir.
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = token.role as "user" | "admin";
        session.user.plan = token.plan as "free" | "pro" | "premium";
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      const protectedPrefixes = ["/dashboard", "/studio", "/admin", "/history", "/favorites", "/billing"];
      const adminPrefixes = ["/admin"];

      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
      if (!isProtected) return true;
      if (!isLoggedIn) return false;

      if (adminPrefixes.some((p) => pathname.startsWith(p)) && auth?.user.role !== "admin") {
        return Response.redirect(new URL("/dashboard", nextUrl.origin));
      }

      return true;
    },
  },
};
