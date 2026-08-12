"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/lib/actions/profile";
import type { Profile } from "@/lib/db/schema";

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    setLoading(true);
    const result = await updateProfileAction({
      fullName: String(form.get("fullName") ?? ""),
      companyName: String(form.get("companyName") ?? ""),
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Profil mis à jour");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Ton nom</Label>
        <Input id="fullName" name="fullName" defaultValue={profile?.fullName ?? ""} placeholder="Jean Artisan" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="companyName">Nom de l&apos;entreprise (sur tes factures)</Label>
        <Input id="companyName" name="companyName" defaultValue={profile?.companyName ?? ""} placeholder="Jean Plomberie" />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
