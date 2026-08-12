"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { getCurrentUser } from "@/lib/auth/current-user";
import { clientSchema, type ClientInput } from "@/lib/validations/client";

async function requireUserId() {
  const current = await getCurrentUser();
  if (!current) throw new Error("Non authentifié");
  return current.authUser.id;
}

export async function listClients() {
  const userId = await requireUserId();
  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.createdAt));
}

export async function getClient(id: string) {
  const userId = await requireUserId();
  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1);
  return client ?? null;
}

type ActionResult = { success: true; id: string } | { success: false; error: string };

export async function createClientAction(input: ClientInput): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const userId = await requireUserId();

  const [created] = await db
    .insert(clients)
    .values({
      userId,
      nom: parsed.data.nom,
      email: parsed.data.email || null,
      telephone: parsed.data.telephone || null,
      adresse: parsed.data.adresse || null,
      notes: parsed.data.notes || null,
    })
    .returning();

  revalidatePath("/clients");
  return { success: true, id: created.id };
}

export async function updateClientAction(id: string, input: ClientInput): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }
  const userId = await requireUserId();

  const [existing] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1);
  if (!existing) return { success: false, error: "Client introuvable" };

  await db
    .update(clients)
    .set({
      nom: parsed.data.nom,
      email: parsed.data.email || null,
      telephone: parsed.data.telephone || null,
      adresse: parsed.data.adresse || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, id));

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { success: true, id };
}

export async function deleteClientAction(id: string): Promise<{ success: boolean; error?: string }> {
  const userId = await requireUserId();
  const [existing] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.userId, userId)))
    .limit(1);
  if (!existing) return { success: false, error: "Client introuvable" };

  await db.delete(clients).where(eq(clients.id, id));
  revalidatePath("/clients");
  return { success: true };
}
