import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { accounts, sessions, users, verificationTokens } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validations/auth";
import { authConfig } from "./auth.config";

/**
 * Config complète (runtime Node) : ajoute l'adapter Drizzle + les providers
 * à la config "edge-safe" partagée avec le middleware (`auth.config.ts`).
 * Auth par e-mail/mot de passe uniquement (pas d'OAuth Google/Apple).
 */
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = loginSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      if (token.sub) {
        // Best-effort : une erreur transitoire (ex. cold start Neon) ne doit
        // pas invalider toute la session — on garde alors role/plan déjà
        // présents dans le token plutôt que de faire échouer jwt().
        try {
          const [dbUser] = await db.select().from(users).where(eq(users.id, token.sub)).limit(1);
          if (dbUser) {
            token.role = dbUser.role;
            token.plan = dbUser.plan;
          }
        } catch (err) {
          console.error("[auth] jwt callback: échec du rafraîchissement role/plan", err);
        }
      }
      return token;
    },
  },
});
