"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { profileSchema, type ProfileInput } from "@/lib/validations/profile";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateProfileAction(input: ProfileInput): Promise<ActionResult> {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const current = await getCurrentUser();
  if (!current) return { success: false, error: "Non authentifié" };

  await db
    .update(profiles)
    .set({
      fullName: parsed.data.fullName || null,
      companyName: parsed.data.companyName || null,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, current.authUser.id));

  revalidatePath("/settings");
  return { success: true };
}

/** Persiste l'URL du logo après upload direct côté client vers Supabase Storage. */
export async function updateLogoUrlAction(logoUrl: string): Promise<ActionResult> {
  const current = await getCurrentUser();
  if (!current) return { success: false, error: "Non authentifié" };

  await db.update(profiles).set({ logoUrl, updatedAt: new Date() }).where(eq(profiles.id, current.authUser.id));

  revalidatePath("/settings");
  return { success: true };
}
