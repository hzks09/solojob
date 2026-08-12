"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { createDevisAction, updateDevisAction } from "@/lib/actions/devis";
import type { Client, Devis, DevisLigne } from "@/lib/db/schema";

type LigneState = { description: string; quantite: string; prixUnitaire: string };

const EMPTY_LIGNE: LigneState = { description: "", quantite: "1", prixUnitaire: "" };

export function DevisForm({
  clients,
  devis,
  initialLignes,
}: {
  clients: Client[];
  devis?: Devis;
  initialLignes?: DevisLigne[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(devis?.clientId ?? clients[0]?.id ?? "");
  const [dateValidite, setDateValidite] = useState(devis?.dateValidite ?? "");
  const [lignes, setLignes] = useState<LigneState[]>(
    initialLignes && initialLignes.length > 0
      ? initialLignes.map((l) => ({ description: l.description, quantite: l.quantite, prixUnitaire: l.prixUnitaire }))
      : [EMPTY_LIGNE]
  );
  const [loading, setLoading] = useState(false);

  const total = lignes.reduce((sum, l) => sum + (Number(l.quantite) || 0) * (Number(l.prixUnitaire) || 0), 0);

  function updateLigne(index: number, field: keyof LigneState, value: string) {
    setLignes((prev) => prev.map((l, i) => (i === index ? { ...l, [field]: value } : l)));
  }

  function addLigne() {
    setLignes((prev) => [...prev, { ...EMPTY_LIGNE }]);
  }

  function removeLigne(index: number) {
    setLignes((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientId) {
      toast.error("Choisis un client");
      return;
    }

    const input = {
      clientId,
      dateValidite,
      lignes: lignes.map((l) => ({
        description: l.description,
        quantite: Number(l.quantite) || 0,
        prixUnitaire: Number(l.prixUnitaire) || 0,
      })),
    };

    setLoading(true);
    const result = devis ? await updateDevisAction(devis.id, input) : await createDevisAction(input);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(devis ? "Devis mis à jour" : "Devis créé");
    router.push(`/devis/${result.id}`);
    router.refresh();
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-sm text-muted">
          Ajoute d&apos;abord un{" "}
          <Link href="/clients/new" className="text-brand font-medium">
            client
          </Link>{" "}
          pour créer un devis.
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="clientId">Client *</Label>
          <select
            id="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="h-12 w-full rounded-xl border border-card-border bg-card px-3 text-base"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateValidite">Valable jusqu&apos;au</Label>
          <Input
            id="dateValidite"
            type="date"
            value={dateValidite ?? ""}
            onChange={(e) => setDateValidite(e.target.value)}
            className="h-12 text-base"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Lignes</Label>
        {lignes.map((ligne, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 pt-4">
              <Input
                placeholder="Description (ex: Remplacement robinet)"
                value={ligne.description}
                onChange={(e) => updateLigne(i, "description", e.target.value)}
                className="h-12 text-base"
                required
              />
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="Qté"
                  value={ligne.quantite}
                  onChange={(e) => updateLigne(i, "quantite", e.target.value)}
                  className="h-12 w-20 text-base"
                  required
                />
                <span className="text-muted">×</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Prix unitaire €"
                  value={ligne.prixUnitaire}
                  onChange={(e) => updateLigne(i, "prixUnitaire", e.target.value)}
                  className="h-12 flex-1 text-base"
                  required
                />
                <button
                  type="button"
                  onClick={() => removeLigne(i)}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-card hover:text-red-500"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={addLigne} className="w-full">
          <Plus className="h-4 w-4" /> Ajouter une ligne
        </Button>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between pt-6">
          <span className="text-sm text-muted">Total</span>
          <span className="text-2xl font-semibold">{total.toFixed(2)} €</span>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Enregistrement..." : devis ? "Enregistrer" : "Créer le devis"}
      </Button>
    </form>
  );
}
