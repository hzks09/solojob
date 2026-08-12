"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminDeleteGeneration } from "@/lib/actions/admin";
import type { Generation } from "@/lib/db/schema";

export function ContentGrid({ generations }: { generations: Generation[] }) {
  const [items, setItems] = useState(generations);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {items.map((g) => (
        <Card key={g.id} className="overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={g.resultImageUrl ?? g.originalImageUrl} alt={g.style} className="aspect-square w-full object-cover" />
          <CardContent className="space-y-2 pt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium capitalize">{g.style}</p>
              {g.isPublic && <Badge>Public</Badge>}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={isPending}
              onClick={() =>
                startTransition(async () => {
                  await adminDeleteGeneration(g.id);
                  setItems((prev) => prev.filter((i) => i.id !== g.id));
                  toast.success("Contenu supprimé");
                })
              }
            >
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
