"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/lib/actions/auth";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    if (!acceptedTerms) {
      toast.error("Accepte les CGU et la politique de confidentialité pour continuer");
      return;
    }

    setLoading(true);
    const result = await signupAction({
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell title="Vérifie ta boîte mail" subtitle="On t'a envoyé un lien de confirmation">
        <p className="text-center text-sm text-muted">
          Clique sur le lien reçu par e-mail pour activer ton compte, puis reviens te{" "}
          <Link href="/login" className="text-brand font-medium">
            connecter
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="3 factures gratuites par mois pour commencer"
      footer={
        <>
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-brand">
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name">Nom</Label>
          <Input id="name" name="name" required placeholder="Ton nom" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required placeholder="toi@exemple.com" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Mot de passe</Label>
          <Input id="password" name="password" type="password" required placeholder="8 caractères min." />
        </div>
        <div className="flex items-start gap-2">
          <input
            id="acceptedTerms"
            type="checkbox"
            required
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-card-border"
          />
          <Label htmlFor="acceptedTerms" className="font-normal leading-snug">
            J&apos;accepte les{" "}
            <Link href="/cgu" target="_blank" className="text-brand underline">
              CGU
            </Link>{" "}
            et la{" "}
            <Link href="/confidentialite" target="_blank" className="text-brand underline">
              politique de confidentialité
            </Link>
          </Label>
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>
    </AuthShell>
  );
}
