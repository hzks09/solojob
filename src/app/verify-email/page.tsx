import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { verifyEmailToken } from "@/lib/auth/actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <AuthShell title="Lien invalide" subtitle="Aucun jeton de vérification fourni">
        <Link href="/login" className="text-brand text-sm font-medium">
          Retour à la connexion
        </Link>
      </AuthShell>
    );
  }

  const result = await verifyEmailToken(token);

  return (
    <AuthShell
      title={result.success ? "E-mail vérifié" : "Échec de la vérification"}
      subtitle={result.success ? "Ton compte est maintenant actif" : "error" in result ? result.error : undefined}
    >
      <Link href="/login" className="block text-center text-brand text-sm font-medium">
        Se connecter
      </Link>
    </AuthShell>
  );
}
