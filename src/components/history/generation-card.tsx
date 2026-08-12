"use client";

import { useState, useTransition } from "react";
import { Heart, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteGeneration, togglePublicGallery, toggleFavorite } from "@/lib/actions/generations";
import type { Generation } from "@/lib/db/schema";

export function GenerationCard({ generation }: { generation: Generation }) {
  const [isFavorite, setIsFavorite] = useState(generation.isFavorite);
  const [isPublic, setIsPublic] = useState(generation.isPublic);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (deleted) return null;

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={generation.resultImageUrl ?? generation.originalImageUrl}
          alt={generation.style}
          className="h-full w-full object-cover"
        />
        <div className="absolute right-2 top-2 flex gap-1">
          <button
            aria-label="Favori"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await toggleFavorite(generation.id);
                setIsFavorite(res.favorited);
              })
            }
            className="rounded-full bg-black/50 p-2 text-white backdrop-blur"
          >
            <Heart className={cn("h-4 w-4", isFavorite && "fill-current text-brand")} />
          </button>
        </div>
      </div>
      <CardContent className="space-y-2 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium capitalize">{generation.style}</p>
          <Badge variant="outline" className="capitalize">
            {generation.status}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const res = await togglePublicGallery(generation.id);
                setIsPublic(res.isPublic);
                toast.success(res.isPublic ? "Publié dans la galerie" : "Retiré de la galerie");
              })
            }
          >
            <Share2 className="h-3.5 w-3.5" />
            {isPublic ? "Publié" : "Publier"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteGeneration(generation.id);
                setDeleted(true);
              })
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
