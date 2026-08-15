"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { savedVideos, videos } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function listSavedVideosAction() {
  const current = await getCurrentUser();
  if (!current) return [];

  return db
    .select({ video: videos, savedAt: savedVideos.savedAt })
    .from(savedVideos)
    .innerJoin(videos, eq(savedVideos.videoId, videos.id))
    .where(eq(savedVideos.userId, current.authUser.id))
    .orderBy(desc(savedVideos.savedAt));
}

export async function removeSavedVideoAction(videoId: string): Promise<{ success: boolean }> {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");

  await db
    .delete(savedVideos)
    .where(and(eq(savedVideos.userId, current.authUser.id), eq(savedVideos.videoId, videoId)));

  revalidatePath("/liste");
  return { success: true };
}
