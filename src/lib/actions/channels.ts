"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { favoriteChannels } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

/** Set des `channelId` favoris de l'utilisateur — utilisé pour l'état de l'étoile côté client. */
export async function getFavoriteChannelIdsAction(): Promise<string[]> {
  const current = await getCurrentUser();
  if (!current) return [];

  const rows = await db
    .select({ channelId: favoriteChannels.channelId })
    .from(favoriteChannels)
    .where(eq(favoriteChannels.userId, current.authUser.id));

  return rows.map((r) => r.channelId);
}

export async function listFavoriteChannelsAction() {
  const current = await getCurrentUser();
  if (!current) return [];

  return db
    .select()
    .from(favoriteChannels)
    .where(eq(favoriteChannels.userId, current.authUser.id))
    .orderBy(desc(favoriteChannels.createdAt));
}

export async function toggleFavoriteChannelAction(
  channelId: string,
  channelTitle: string
): Promise<{ success: boolean; favorited: boolean }> {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");
  const userId = current.authUser.id;

  const [existing] = await db
    .select({ channelId: favoriteChannels.channelId })
    .from(favoriteChannels)
    .where(and(eq(favoriteChannels.userId, userId), eq(favoriteChannels.channelId, channelId)))
    .limit(1);

  if (existing) {
    await db
      .delete(favoriteChannels)
      .where(and(eq(favoriteChannels.userId, userId), eq(favoriteChannels.channelId, channelId)));
    revalidatePath("/liste");
    return { success: true, favorited: false };
  }

  await db.insert(favoriteChannels).values({ userId, channelId, channelTitle }).onConflictDoNothing();
  revalidatePath("/liste");
  return { success: true, favorited: true };
}

export async function removeFavoriteChannelAction(channelId: string): Promise<{ success: boolean }> {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");

  await db
    .delete(favoriteChannels)
    .where(and(eq(favoriteChannels.userId, current.authUser.id), eq(favoriteChannels.channelId, channelId)));

  revalidatePath("/liste");
  return { success: true };
}
