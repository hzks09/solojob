"use server";

import { createClient } from "@/lib/supabase/server";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/request-ip";
import {
  loginSchema,
  registerSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type LoginInput,
  type RegisterInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

type ActionResult = { success: true } | { success: false; error: string };

const RATE_LIMIT_MESSAGE = "Trop de tentatives, réessaie dans une minute.";
// Un throw non intercepté depuis une Server Action fait planter toute la page
// (écran d'erreur générique) au lieu d'un simple message côté formulaire —
// chaque appel réseau vers l'API Auth Supabase ci-dessous est donc protégé.
const NETWORK_ERROR_MESSAGE = "Problème de connexion au service, réessaie dans quelques secondes.";

/** 5 tentatives / minute, par IP + e-mail quand disponible — anti-bourrinage sur l'authentification. */
async function checkAuthRateLimit(scope: string, email?: string) {
  const ip = await clientIp();
  const key = email ? `${scope}:${ip}:${email}` : `${scope}:${ip}`;
  return rateLimit(key, 5, 60_000);
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const limit = await checkAuthRateLimit("login", parsed.data.email);
  if (!limit.success) return { success: false, error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return { success: false, error: "E-mail ou mot de passe incorrect" };
  } catch {
    return { success: false, error: NETWORK_ERROR_MESSAGE };
  }

  return { success: true };
}

export async function signupAction(input: RegisterInput): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const limit = await checkAuthRateLimit("signup", parsed.data.email);
  if (!limit.success) return { success: false, error: RATE_LIMIT_MESSAGE };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.name },
        emailRedirectTo: `${appUrl}/auth/callback?type=signup`,
      },
    });

    if (error) {
      return {
        success: false,
        error: error.message === "User already registered" ? "Un compte existe déjà avec cet e-mail" : error.message,
      };
    }
  } catch {
    return { success: false, error: NETWORK_ERROR_MESSAGE };
  }
  return { success: true };
}

export async function forgotPasswordAction(input: ForgotPasswordInput): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const limit = await checkAuthRateLimit("forgot-password", parsed.data.email);
  if (!limit.success) return { success: false, error: RATE_LIMIT_MESSAGE };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  try {
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
    });
  } catch {
    return { success: false, error: NETWORK_ERROR_MESSAGE };
  }

  // Toujours succès côté UI (anti-énumération) — Supabase ne révèle pas si l'email existe.
  return { success: true };
}

export async function resetPasswordAction(input: ResetPasswordInput): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Formulaire invalide" };
  }

  const limit = await checkAuthRateLimit("reset-password");
  if (!limit.success) return { success: false, error: RATE_LIMIT_MESSAGE };

  const supabase = await createClient();
  try {
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { success: false, error: error.message };
  } catch {
    return { success: false, error: NETWORK_ERROR_MESSAGE };
  }

  return { success: true };
}
