"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/lib/actions/auth";
import { safeRedirectPath } from "@/lib/safe-redirect";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = safeRedirectPath(searchParams.get("callbackUrl"));
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    setLoading(true);
    const result = await loginAction({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <AuthShell
      title="Bon retour"
      subtitle="Connecte-toi pour retrouver tes découvertes"
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/signup" className="font-medium text-brand">
            Créer un compte
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" name="email" type="email" required placeholder="toi@exemple.com" />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <Link href="/forgot-password" className="text-xs text-brand">
              Mot de passe oublié ?
            </Link>
          </div>
          <Input id="password" name="password" type="password" required placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </form>
    </AuthShell>
  );
}
