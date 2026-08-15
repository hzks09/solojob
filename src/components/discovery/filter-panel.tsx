"use client";

import { useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, Star } from "lucide-react";
import { MOOD_CATEGORIES } from "@/lib/youtube/moods";
import { cn } from "@/lib/utils";
import type { DiscoveryFilters, DurationBucket } from "@/lib/actions/discovery";

const DURATION_OPTIONS: { value: DurationBucket; label: string }[] = [
  { value: "short", label: "< 4 min" },
  { value: "medium", label: "4-20 min" },
  { value: "long", label: "> 20 min" },
];

// Langues les plus courantes — suffisant vu que `videos.language` (déduit de
// `defaultAudioLanguage` YouTube) est souvent peu renseigné.
const LANGUAGE_OPTIONS = [
  { value: "fr", label: "Français" },
  { value: "en", label: "Anglais" },
  { value: "es", label: "Espagnol" },
];

export function FilterPanel({
  filters,
  onChange,
  advancedFiltersAllowed,
}: {
  filters: DiscoveryFilters;
  onChange: (filters: DiscoveryFilters) => void;
  advancedFiltersAllowed: boolean;
}) {
  const [open, setOpen] = useState(false);
  const activeCount =
    (filters.durationBucket ? 1 : 0) +
    (filters.language ? 1 : 0) +
    (filters.tags?.length ?? 0) +
    (filters.favoriteChannelsOnly ? 1 : 0);

  function toggleTag(tag: string) {
    const current = filters.tags ?? [];
    const next = current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag];
    onChange({ ...filters, tags: next.length ? next : undefined });
  }

  function setDuration(bucket: DurationBucket) {
    if (!advancedFiltersAllowed) return;
    onChange({ ...filters, durationBucket: filters.durationBucket === bucket ? undefined : bucket });
  }

  function setLanguage(lang: string) {
    if (!advancedFiltersAllowed) return;
    onChange({ ...filters, language: filters.language === lang ? undefined : lang });
  }

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-muted hover:text-foreground"
      >
        <SlidersHorizontal className="h-4 w-4" />
        Filtres{activeCount > 0 && <span className="rounded-full bg-action px-1.5 text-xs text-action-foreground">{activeCount}</span>}
      </button>

      {open && (
        <div className="mt-3 rounded-2xl border border-card-border bg-card p-4">
          <button
            type="button"
            onClick={() => onChange({ ...filters, favoriteChannelsOnly: !filters.favoriteChannelsOnly || undefined })}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              filters.favoriteChannelsOnly
                ? "border-action bg-action/10 text-action"
                : "border-card-border text-muted hover:text-foreground"
            )}
          >
            <Star className={cn("h-4 w-4", filters.favoriteChannelsOnly && "fill-action")} />
            Chaînes favorites uniquement
          </button>

          <div className="mt-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              Durée
              {!advancedFiltersAllowed && <span className="text-action">Loupick+</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDuration(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    !advancedFiltersAllowed && "cursor-not-allowed opacity-50",
                    filters.durationBucket === opt.value
                      ? "border-action bg-action/10 text-action"
                      : "border-card-border text-muted hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
              Langue
              {!advancedFiltersAllowed && <span className="text-action">Loupick+</span>}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLanguage(opt.value)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    !advancedFiltersAllowed && "cursor-not-allowed opacity-50",
                    filters.language === opt.value
                      ? "border-action bg-action/10 text-action"
                      : "border-card-border text-muted hover:text-foreground"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {!advancedFiltersAllowed && (
            <p className="mt-2 text-xs text-muted">
              Durée et langue sont réservés à{" "}
              <Link href="/billing" className="font-medium text-action hover:underline">
                Loupick+
              </Link>
              .
            </p>
          )}

          <div className="mt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Centres d&apos;intérêt</p>
            <div className="mt-2 space-y-2">
              {MOOD_CATEGORIES.map((mood) => (
                <div key={mood.tag}>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleTag(mood.tag)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        filters.tags?.includes(mood.tag)
                          ? "border-action bg-action/10 text-action"
                          : "border-card-border text-muted hover:text-foreground"
                      )}
                    >
                      {mood.label}
                    </button>
                    {mood.subCategories.map((sub) => (
                      <button
                        key={sub.tag}
                        type="button"
                        onClick={() => toggleTag(sub.tag)}
                        className={cn(
                          "rounded-full border px-2.5 py-1 text-xs transition-colors",
                          filters.tags?.includes(sub.tag)
                            ? "border-action bg-action/10 text-action"
                            : "border-card-border text-muted hover:text-foreground"
                        )}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({})}
              className="mt-4 text-xs font-medium text-muted underline hover:text-foreground"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
}
