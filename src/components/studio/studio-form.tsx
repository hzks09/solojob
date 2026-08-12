"use client";

import { useCallback, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { getOrCreateProject } from "@/lib/actions/projects";
import {
  BUDGET_MODES,
  CREDIT_COST,
  DESIGN_STYLES,
  PLANS,
  ROOM_TYPES,
  TRANSFORMATION_LEVELS,
} from "@/lib/constants";
import type { GenerationQuality } from "@/lib/db/schema";

const QUALITY_OPTIONS: { value: GenerationQuality; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "hd", label: "HD" },
  { value: "ultra_hd", label: "Ultra HD" },
];

const QUALITY_RANK: Record<GenerationQuality, number> = { standard: 0, hd: 1, ultra_hd: 2 };

type GenState = "idle" | "uploading" | "generating" | "done" | "error";

export function StudioForm({ initialStyle }: { initialStyle?: string } = {}) {
  const { data: session } = useSession();
  const plan = session?.user.plan ?? "free";
  const planConfig = PLANS[plan];

  const [roomType, setRoomType] = useState(ROOM_TYPES[0].value);
  const [style, setStyle] = useState<string>(
    DESIGN_STYLES.find((s) => s.value === initialStyle)?.value ?? DESIGN_STYLES[0].value
  );
  const [budgetMode, setBudgetMode] = useState(BUDGET_MODES[3].value);
  const [transformationLevel, setTransformationLevel] = useState(TRANSFORMATION_LEVELS[1].value);
  const [quality, setQuality] = useState<GenerationQuality>("standard");
  const [customPrompt, setCustomPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [state, setState] = useState<GenState>("idle");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (file: File) => {
    setImagePreview(URL.createObjectURL(file));
    setImageUrl(null);
    setUploadError(null);
    setState("uploading");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        const message = data.error ?? "Échec de l'upload";
        setUploadError(message);
        toast.error(message);
        setState("idle");
        return;
      }
      setImageUrl(data.url);
      setState("idle");
    } catch {
      const message = "Échec de l'upload — vérifie ta connexion";
      setUploadError(message);
      toast.error(message);
      setState("idle");
    }
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  async function pollStatus(generationId: string) {
    for (let i = 0; i < 40; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      const res = await fetch(`/api/generate/${generationId}/status`);
      const data = await res.json();

      if (data.status === "completed") {
        setResultUrl(data.resultImageUrl);
        setState("done");
        return;
      }
      if (data.status === "failed") {
        toast.error(data.errorMessage ?? "La génération a échoué");
        setState("error");
        return;
      }
    }
    toast.error("La génération prend plus de temps que prévu");
    setState("error");
  }

  async function handleGenerate() {
    if (!imageUrl) {
      toast.error("Ajoute une photo de la pièce");
      return;
    }
    if (QUALITY_RANK[quality] > QUALITY_RANK[planConfig.maxQuality]) {
      toast.error(`Ton forfait "${planConfig.name}" ne permet pas la qualité "${quality}"`);
      return;
    }

    setState("generating");
    setResultUrl(null);

    try {
      const project = await getOrCreateProject(roomType);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          imageUrl,
          roomType,
          style,
          budgetMode,
          dominantColors: [],
          transformationLevel,
          customPrompt: planConfig.designerAi ? customPrompt : undefined,
          quality,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Échec de la génération");
        setState("error");
        return;
      }

      await pollStatus(data.generationId);
    } catch {
      toast.error("Une erreur est survenue");
      setState("error");
    }
  }

  const busy = state === "uploading" || state === "generating";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1fr]">
      <Card>
        <CardContent className="space-y-6 pt-6">
          <section>
            <Label>Type de pièce</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {ROOM_TYPES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRoomType(r.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    roomType === r.value ? "border-brand bg-brand/10 text-brand" : "border-card-border"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <Label>Style</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {DESIGN_STYLES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStyle(s.value)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    style === s.value ? "border-brand bg-brand/10 text-brand" : "border-card-border"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>

          <section className="grid grid-cols-2 gap-4">
            <div>
              <Label>Budget</Label>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-card-border bg-card px-3 text-sm"
                value={budgetMode}
                onChange={(e) => setBudgetMode(e.target.value as typeof budgetMode)}
              >
                {BUDGET_MODES.map((b) => (
                  <option key={b.value} value={b.value}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Transformation</Label>
              <select
                className="mt-2 h-11 w-full rounded-xl border border-card-border bg-card px-3 text-sm"
                value={transformationLevel}
                onChange={(e) => setTransformationLevel(e.target.value as typeof transformationLevel)}
              >
                {TRANSFORMATION_LEVELS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section>
            <Label>Qualité</Label>
            <div className="mt-2 flex gap-2">
              {QUALITY_OPTIONS.map((q) => {
                const locked = QUALITY_RANK[q.value] > QUALITY_RANK[planConfig.maxQuality];
                return (
                  <button
                    key={q.value}
                    type="button"
                    disabled={locked}
                    onClick={() => setQuality(q.value)}
                    className={cn(
                      "flex-1 rounded-xl border px-3 py-2 text-sm transition-colors disabled:opacity-40",
                      quality === q.value ? "border-brand bg-brand/10 text-brand" : "border-card-border"
                    )}
                  >
                    {q.label}
                    <div className="text-xs text-muted">{CREDIT_COST[q.value]} crédit(s)</div>
                  </button>
                );
              })}
            </div>
          </section>

          {planConfig.designerAi && (
            <section>
              <Label>Designer IA — décris ta pièce idéale</Label>
              <textarea
                className="mt-2 w-full rounded-xl border border-card-border bg-card p-3 text-sm"
                rows={3}
                placeholder="Ex : chambre inspirée des hôtels japonais, bois clair, plantes, éclairage chaleureux..."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
              />
            </section>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <Label>Photo de la pièce</Label>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative mt-2 flex aspect-video cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-card-border bg-background/50"
            >
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Aperçu" className="h-full w-full object-cover" />
              ) : (
                <p className="text-sm text-muted">Glisse-dépose une photo, ou clique pour en choisir une</p>
              )}
              {state === "uploading" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white">
                  Envoi de la photo...
                </div>
              )}
              {imageUrl && state !== "uploading" && (
                <Badge className="absolute right-2 top-2">Photo envoyée</Badge>
              )}
            </div>
            {uploadError && <p className="mt-2 text-sm text-red-500">{uploadError}</p>}
            <Input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
            />
          </CardContent>
        </Card>

        <Button className="w-full" size="lg" disabled={busy} onClick={handleGenerate}>
          {state === "uploading" && "Envoi de la photo..."}
          {state === "generating" && "Génération en cours..."}
          {(state === "idle" || state === "done" || state === "error") && "Générer"}
        </Button>

        {resultUrl && (
          <Card>
            <CardContent className="pt-6">
              <div className="mb-2 flex items-center gap-2">
                <Badge>Résultat</Badge>
                {planConfig.watermark && <Badge variant="outline">Avec filigrane</Badge>}
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={resultUrl} alt="Résultat généré" className="w-full rounded-2xl" />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
