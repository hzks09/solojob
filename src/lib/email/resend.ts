import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM = process.env.EMAIL_FROM ?? "SoloJob <onboarding@resend.dev>";

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.warn(`[email] RESEND_API_KEY manquant — e-mail non envoyé (to=${to}, subject="${subject}")`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendRelanceEmail(params: {
  to: string;
  clientNom: string;
  factureNumero: string;
  montant: string;
  artisanNom: string;
  paymentLinkUrl?: string | null;
}) {
  const { to, clientNom, factureNumero, montant, artisanNom, paymentLinkUrl } = params;

  await send(
    to,
    `Rappel — Facture ${factureNumero} en attente de paiement`,
    `<div style="font-family:sans-serif;max-width:480px;margin:auto">
      <p>Bonjour ${clientNom},</p>
      <p>Petit rappel : la facture <strong>${factureNumero}</strong> d'un montant de <strong>${montant} €</strong>
      auprès de ${artisanNom} est toujours en attente de paiement.</p>
      ${
        paymentLinkUrl
          ? `<a href="${paymentLinkUrl}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:12px">Payer en ligne</a>`
          : ""
      }
      <p style="color:#888;font-size:12px;margin-top:24px">Si le paiement a déjà été effectué, ignore cet e-mail.</p>
    </div>`
  );
}
