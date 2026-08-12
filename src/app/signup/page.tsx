"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerUser } from "@/lib/auth/actions";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const result = await registerUser({
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
      subtitle="5 générations gratuites pour commencer"
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
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Création..." : "Créer mon compte"}
        </Button>
      </form>
    </AuthShell>
  );
}
