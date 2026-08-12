"use server";

import { and, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { gallery, generations, reports, votes } from "@/lib/db/schema";

export async function listGallery(sort: "votes" | "recent" = "votes") {
  const rows = await db
    .select({ gallery: gallery, generation: generations })
    .from(gallery)
    .innerJoin(generations, eq(gallery.generationId, generations.id))
    .where(eq(generations.isPublic, true))
    .orderBy(sort === "votes" ? desc(gallery.votesCount) : desc(gallery.createdAt))
    .limit(60);

  return rows;
}

export async function toggleVote(generationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  let [entry] = await db.select().from(gallery).where(eq(gallery.generationId, generationId)).limit(1);
  if (!entry) {
    [entry] = await db.insert(gallery).values({ generationId }).returning();
  }

  const [existingVote] = await db
    .select()
    .from(votes)
    .where(and(eq(votes.userId, session.user.id), eq(votes.galleryId, entry.id)))
    .limit(1);

  if (existingVote) {
    await db.delete(votes).where(eq(votes.id, existingVote.id));
    await db
      .update(gallery)
      .set({ votesCount: sql`greatest(${gallery.votesCount} - 1, 0)` })
      .where(eq(gallery.id, entry.id));
    revalidatePath("/gallery");
    return { voted: false };
  }

  await db.insert(votes).values({ userId: session.user.id, galleryId: entry.id });
  await db
    .update(gallery)
    .set({ votesCount: sql`${gallery.votesCount} + 1` })
    .where(eq(gallery.id, entry.id));
  revalidatePath("/gallery");
  return { voted: true };
}

export async function reportGeneration(generationId: string, reason: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  await db.insert(reports).values({ reporterId: session.user.id, generationId, reason });
  return { success: true };
}
