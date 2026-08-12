"use server";

import { and, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { projects, type RoomType } from "@/lib/db/schema";

export async function getOrCreateProject(roomType: RoomType) {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  const [existing] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, session.user.id), eq(projects.roomType, roomType)))
    .orderBy(desc(projects.createdAt))
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(projects)
    .values({ userId: session.user.id, roomType })
    .returning();

  return created;
}

export async function listUserProjects() {
  const session = await auth();
  if (!session?.user) throw new Error("Non authentifié");

  return db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))
    .orderBy(desc(projects.createdAt));
}
