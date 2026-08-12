"use server";

import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/lib/db";
import { creditsLedger, emailVerificationTokens, passwordResetTokens, users } from "@/lib/db/schema";
import {
  forgotPasswordSchema,
  registerSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type RegisterInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email/resend";

type ActionResult = { success: true } | { success: false; error: string };

const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export async function registerUser(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { name, email, password } = parsed.data;

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet e-mail" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ name, email, passwordHash, creditsRemaining: 5 })
    .returning();

  await db.insert(creditsLedger).values({ userId: user.id, amount: 5, reason: "signup_bonus" });

  const token = nanoid(32);
  await db.insert(emailVerificationTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
  });

  await sendVerificationEmail(email, token);

  return { success: true };
}

export async function verifyEmailToken(token: string): Promise<ActionResult> {
  const [record] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.token, token))
    .limit(1);

  if (!record || record.expiresAt < new Date()) {
    return { success: false, error: "Lien de vérification invalide ou expiré" };
  }

  await db.update(users).set({ emailVerified: new Date() }).where(eq(users.id, record.userId));
  await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, record.id));

  return { success: true };
}

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const [user] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  // Toujours répondre succès même si l'utilisateur n'existe pas (anti-énumération)
  if (!user) return { success: true };

  const token = nanoid(32);
  await db.insert(passwordResetTokens).values({
    userId: user.id,
    token,
    expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
  });

  await sendPasswordResetEmail(user.email, token);

  return { success: true };
}

export async function resetPassword(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }
  const { token, password } = parsed.data;

  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.token, token))
    .limit(1);

  if (!record || record.expiresAt < new Date()) {
    return { success: false, error: "Lien de réinitialisation invalide ou expiré" };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await db.update(users).set({ passwordHash }).where(eq(users.id, record.userId));
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.id, record.id));

  return { success: true };
}
