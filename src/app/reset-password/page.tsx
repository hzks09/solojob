"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { resetPasswordSchema } from "@/lib/validations/auth";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    const parsed = resetPasswordSchema.safeParse({ password: form.get("password") });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Mot de passe mis à jour");
    router.push("/dashboard");
  }

  if (hasSession === false) {
    return (
      <AuthShell title="Lien invalide ou expiré" subtitle="Redemande un lien de réinitialisation">
        <Link href="/forgot-password" className="text-brand font-medium text-sm">
          Redemander un lien
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Nouveau mot de passe" subtitle="Choisis un mot de passe sécurisé">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <Input id="password" name="password" type="password" required placeholder="8 caractères min." />
        </div>
        <Button type="submit" className="w-full" disabled={loading || hasSession === null}>
          {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
        </Button>
      </form>
    </AuthShell>
  );
}
