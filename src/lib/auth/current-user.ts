import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/**
 * Un ralentissement réseau ponctuel entre Vercel et l'API Auth Supabase ne
 * doit pas faire planter toute la page (écran d'erreur générique) — un seul
 * essai suffit presque toujours à absorber ce type de blip transitoire.
 */
async function getAuthUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  try {
    return (await supabase.auth.getUser()).data.user;
  } catch {
    return (await supabase.auth.getUser()).data.user;
  }
}

/** Utilisateur Supabase Auth courant + son profil métier (table `profiles`). */
export async function getCurrentUser() {
  const supabase = await createClient();
  const user = await getAuthUser(supabase);

  if (!user) return null;

  const [profile] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  return { authUser: user, profile: profile ?? null };
}
