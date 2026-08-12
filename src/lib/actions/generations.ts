"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { detectedObjects, favorites, gallery, generations } from "@/lib/db/schema";

export async function listHistory() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  return db
    .select()
    .from(generations)
    .where(eq(generations.userId, session.user.id))
    .orderBy(desc(generations.createdAt));
}

export async function listFavorites() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const rows = await db
    .select({ generation: generations })
    .from(favorites)
    .innerJoin(generations, eq(favorites.generationId, generations.id))
    .where(eq(favorites.userId, session.user.id))
    .orderBy(desc(favorites.createdAt));

  return rows.map((r) => r.generation);
}

export async function toggleFavorite(generationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const [existing] = await db
    .select()
    .from(favorites)
    .where(and(eq(favorites.userId, session.user.id), eq(favorites.generationId, generationId)))
    .limit(1);

  if (existing) {
    await db.delete(favorites).where(eq(favorites.id, existing.id));
    await db.update(generations).set({ isFavorite: false }).where(eq(generations.id, generationId));
  } else {
    await db.insert(favorites).values({ userId: session.user.id, generationId });
    await db.update(generations).set({ isFavorite: true }).where(eq(generations.id, generationId));
  }

  revalidatePath("/history");
  revalidatePath("/favorites");
  return { favorited: !existing };
}

export async function deleteGeneration(generationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const [gen] = await db.select().from(generations).where(eq(generations.id, generationId)).limit(1);
  if (!gen || gen.userId !== session.user.id) throw new Error("Introuvable");

  await db.delete(generations).where(eq(generations.id, generationId));
  revalidatePath("/history");
}

export async function togglePublicGallery(generationId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const [gen] = await db.select().from(generations).where(eq(generations.id, generationId)).limit(1);
  if (!gen || gen.userId !== session.user.id) throw new Error("Introuvable");

  const nextValue = !gen.isPublic;
  await db.update(generations).set({ isPublic: nextValue }).where(eq(generations.id, generationId));

  if (nextValue) {
    const [existingEntry] = await db.select().from(gallery).where(eq(gallery.generationId, generationId)).limit(1);
    if (!existingEntry) {
      await db.insert(gallery).values({ generationId });
    }
  }

  revalidatePath("/history");
  revalidatePath("/gallery");
  return { isPublic: nextValue };
}

export async function getGenerationDetail(generationId: string) {
  const session = await auth();

  const [generation] = await db.select().from(generations).where(eq(generations.id, generationId)).limit(1);
  if (!generation) return null;

  const canView = generation.isPublic || generation.userId === session?.user.id || session?.user.role === "admin";
  if (!canView) return null;

  const objects = await db
    .select()
    .from(detectedObjects)
    .where(eq(detectedObjects.generationId, generationId));

  return { generation, objects };
}
