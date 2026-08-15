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
  const [tvaApplicable, setTvaApplicable] = useState(profile?.tvaApplicable ?? false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);

    setLoading(true);
    const result = await updateProfileAction({
      fullName: String(form.get("fullName") ?? ""),
      companyName: String(form.get("companyName") ?? ""),
      siret: String(form.get("siret") ?? ""),
      adresse: String(form.get("adresse") ?? ""),
      codePostal: String(form.get("codePostal") ?? ""),
      ville: String(form.get("ville") ?? ""),
      tvaApplicable,
      numeroTva: String(form.get("numeroTva") ?? ""),
      iban: String(form.get("iban") ?? ""),
    });
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Profil mis à jour");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-6">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="fullName">Ton nom</Label>
          <Input id="fullName" name="fullName" defaultValue={profile?.fullName ?? ""} placeholder="Jean Artisan" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="companyName">Nom de l&apos;entreprise (sur tes factures)</Label>
          <Input
            id="companyName"
            name="companyName"
            defaultValue={profile?.companyName ?? ""}
            placeholder="Jean Plomberie"
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-card-border p-4">
        <div>
          <p className="text-sm font-medium">Informations légales (obligatoires sur tes factures)</p>
          <p className="mt-1 text-xs text-muted">
            En France, une facture doit obligatoirement porter le SIRET et l&apos;adresse de l&apos;émetteur. Sans
            ces infos, tes factures ne sont pas conformes.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="siret">SIRET</Label>
          <Input id="siret" name="siret" defaultValue={profile?.siret ?? ""} placeholder="12345678900012" maxLength={14} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="adresse">Adresse</Label>
          <Input id="adresse" name="adresse" defaultValue={profile?.adresse ?? ""} placeholder="12 rue de la Paix" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="codePostal">Code postal</Label>
            <Input id="codePostal" name="codePostal" defaultValue={profile?.codePostal ?? ""} placeholder="75002" maxLength={5} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ville">Ville</Label>
            <Input id="ville" name="ville" defaultValue={profile?.ville ?? ""} placeholder="Paris" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="tvaApplicable"
            type="checkbox"
            checked={tvaApplicable}
            onChange={(e) => setTvaApplicable(e.target.checked)}
            className="h-4 w-4 rounded border-card-border"
          />
          <Label htmlFor="tvaApplicable" className="font-normal">
            TVA applicable (décoché = franchise en base, art. 293B du CGI)
          </Label>
        </div>

        {tvaApplicable && (
          <div className="space-y-1.5">
            <Label htmlFor="numeroTva">Numéro de TVA intracommunautaire</Label>
            <Input id="numeroTva" name="numeroTva" defaultValue={profile?.numeroTva ?? ""} placeholder="FR12345678900" />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="iban">IBAN (optionnel, pour virement)</Label>
          <Input id="iban" name="iban" defaultValue={profile?.iban ?? ""} placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX" />
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
