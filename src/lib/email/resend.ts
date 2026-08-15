import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? "Loupick <onboarding@resend.dev>";

/** Dégradation silencieuse si RESEND_API_KEY est absent — jamais d'erreur. */
export async function sendEmail(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY manquant — e-mail non envoyé (to=${to}, subject="${subject}")`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}
