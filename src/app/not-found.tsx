import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <Logo className="h-10 w-10" />
      <h1 className="font-display text-2xl font-black tracking-tight">Page introuvable</h1>
      <p className="max-w-md text-sm text-muted">
        Ce lien ne mène nulle part — la page a peut-être été supprimée, ou l&apos;adresse est incorrecte.
      </p>
      <Link href="/dashboard" className={buttonVariants({ variant: "action" })}>
        Retour au tableau de bord
      </Link>
    </main>
  );
}
