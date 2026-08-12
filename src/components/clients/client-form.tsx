"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClientAction, deleteClientAction, updateClientAction } from "@/lib/actions/clients";
import type { Client } from "@/lib/db/schema";

export function ClientForm({ client }: { client?: Client }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const input = {
      nom: String(form.get("nom") ?? ""),
      email: String(form.get("email") ?? ""),
      telephone: String(form.get("telephone") ?? ""),
      adresse: String(form.get("adresse") ?? ""),
      notes: String(form.get("notes") ?? ""),
    };

    setLoading(true);
    const result = client ? await updateClientAction(client.id, input) : await createClientAction(input);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(client ? "Client mis à jour" : "Client créé");
    router.push("/clients");
    router.refresh();
  }

  async function handleDelete() {
    if (!client) return;
    if (!confirm(`Supprimer ${client.nom} ? Cette action est irréversible.`)) return;

    setDeleting(true);
    const result = await deleteClientAction(client.id);
    setDeleting(false);

    if (!result.success) {
      toast.error(result.error ?? "Échec de la suppression");
      return;
    }
    toast.success("Client supprimé");
    router.push("/clients");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="nom">Nom *</Label>
        <Input id="nom" name="nom" required defaultValue={client?.nom} placeholder="Nom du client" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} placeholder="client@exemple.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="telephone">Téléphone</Label>
        <Input id="telephone" name="telephone" defaultValue={client?.telephone ?? ""} placeholder="06 12 34 56 78" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="adresse">Adresse</Label>
        <Input id="adresse" name="adresse" defaultValue={client?.adresse ?? ""} placeholder="12 rue de la Paix, Paris" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={client?.notes ?? ""}
          rows={3}
          className="w-full rounded-xl border border-card-border bg-card p-3 text-sm"
          placeholder="Infos utiles sur ce client..."
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : client ? "Enregistrer" : "Créer le client"}
        </Button>
        {client && (
          <Button type="button" variant="ghost" disabled={deleting} onClick={handleDelete}>
            {deleting ? "Suppression..." : "Supprimer"}
          </Button>
        )}
      </div>
    </form>
  );
}
