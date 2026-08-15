import Link from "next/link";

export function LegalInfoWarning() {
  return (
    <div className="rounded-lg border border-action/40 bg-action/10 px-4 py-3 text-sm text-action">
      Complète tes informations légales dans les{" "}
      <Link href="/settings" className="font-medium underline">
        Réglages
      </Link>{" "}
      avant d&apos;envoyer cette facture à un client.
    </div>
  );
}
