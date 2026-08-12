import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? "RoomAI <noreply@roomai.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY manquant — e-mail non envoyé (to=${to}, subject="${subject}")`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await send(
    to,
    "Vérifie ton adresse e-mail — RoomAI",
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Bienvenue sur RoomAI</h2>
      <p>Confirme ton adresse e-mail pour activer ton compte.</p>
      <a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Vérifier mon e-mail</a>
      <p style="color:#888;font-size:12px;margin-top:24px">Ce lien expire dans 24 heures. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>
    </div>`
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await send(
    to,
    "Réinitialise ton mot de passe — RoomAI",
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>Réinitialisation du mot de passe</h2>
      <p>Clique sur le bouton ci-dessous pour choisir un nouveau mot de passe.</p>
      <a href="${url}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">Réinitialiser mon mot de passe</a>
      <p style="color:#888;font-size:12px;margin-top:24px">Ce lien expire dans 1 heure. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>
    </div>`
  );
}
