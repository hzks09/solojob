import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth/auth.config";

/**
 * Middleware Edge : protège les routes utilisateur connecté (voir
 * callbacks.authorized dans auth.config.ts). Volontairement séparé de la
 * config complète (config.ts) qui embarque l'adapter Drizzle + bcrypt, non
 * nécessaires ici.
 */
export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/studio/:path*",
    "/admin/:path*",
    "/history/:path*",
    "/favorites/:path*",
    "/billing/:path*",
  ],
};
