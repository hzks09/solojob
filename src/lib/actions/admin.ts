"use server";

import { count, desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { generations, reports, subscriptions, users } from "@/lib/db/schema";
import { grantCredits } from "@/lib/db/credits";
import type { PlanTier, ReportStatus, UserRole } from "@/lib/db/schema";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    throw new Error("Accès réservé aux administrateurs");
  }
  return session;
}

export async function getAdminStats() {
  await requireAdmin();

  const [[userCount], [generationCount], [publicCount], [paidCount]] = await Promise.all([
    db.select({ value: count() }).from(users),
    db.select({ value: count() }).from(generations),
    db.select({ value: count() }).from(generations).where(eq(generations.isPublic, true)),
    db.select({ value: count() }).from(users).where(sql`${users.plan} != 'free'`),
  ]);

  return {
    userCount: userCount.value,
    generationCount: generationCount.value,
    publicCount: publicCount.value,
    paidCount: paidCount.value,
  };
}

export async function listUsers() {
  await requireAdmin();
  return db.select().from(users).orderBy(desc(users.createdAt)).limit(200);
}

export async function updateUserPlan(userId: string, plan: PlanTier) {
  await requireAdmin();
  await db.update(users).set({ plan }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function updateUserRole(userId: string, role: UserRole) {
  await requireAdmin();
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function adjustUserCredits(userId: string, amount: number) {
  await requireAdmin();
  await grantCredits(userId, amount, "admin_adjustment");
  revalidatePath("/admin/users");
}

export async function listSubscriptions() {
  await requireAdmin();
  return db
    .select({ subscription: subscriptions, user: users })
    .from(subscriptions)
    .innerJoin(users, eq(subscriptions.userId, users.id))
    .orderBy(desc(subscriptions.createdAt))
    .limit(200);
}

export async function listAllGenerations() {
  await requireAdmin();
  return db.select().from(generations).orderBy(desc(generations.createdAt)).limit(200);
}

export async function adminDeleteGeneration(generationId: string) {
  await requireAdmin();
  await db.delete(generations).where(eq(generations.id, generationId));
  revalidatePath("/admin/content");
}

export async function listReports() {
  await requireAdmin();
  return db
    .select({ report: reports, generation: generations })
    .from(reports)
    .innerJoin(generations, eq(reports.generationId, generations.id))
    .orderBy(desc(reports.createdAt))
    .limit(200);
}

export async function updateReportStatus(reportId: string, status: ReportStatus) {
  await requireAdmin();
  await db.update(reports).set({ status }).where(eq(reports.id, reportId));
  revalidatePath("/admin/reports");
}
