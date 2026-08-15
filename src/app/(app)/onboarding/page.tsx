"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction } from "@/lib/actions/onboarding";
import { MOOD_CATEGORIES } from "@/lib/youtube/moods";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function toggle(tag: string) {
    setSelected((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function handleSubmit() {
    setLoading(true);
    const result = await completeOnboardingAction(selected);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error ?? "Choisis au moins 2 catégories");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg py-6 text-center">
      <h1 className="font-display text-2xl font-black tracking-tight">Qu&apos;est-ce qui te plaît ?</h1>
      <p className="mt-2 text-sm text-muted">
        Choisis 2-3 catégories pour démarrer — on affine à chaque swipe ensuite.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3">
        {MOOD_CATEGORIES.map((mood) => (
          <button
            key={mood.tag}
            type="button"
            onClick={() => toggle(mood.tag)}
            className={cn(
              "rounded-xl border-2 px-4 py-4 text-sm font-medium transition-colors",
              selected.includes(mood.tag)
                ? "border-action bg-action/10 text-action"
                : "border-card-border text-muted hover:text-foreground"
            )}
          >
            {mood.label}
          </button>
        ))}
      </div>

      <Button
        variant="action"
        size="lg"
        className="mt-8 w-full"
        disabled={selected.length < 2 || loading}
        onClick={handleSubmit}
      >
        {loading ? "..." : selected.length > 0 ? `Commencer (${selected.length} choisies)` : "Choisis au moins 2 catégories"}
      </Button>
    </div>
  );
}
