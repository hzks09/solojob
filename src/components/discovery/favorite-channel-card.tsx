"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { removeFavoriteChannelAction } from "@/lib/actions/channels";
import type { FavoriteChannel } from "@/lib/db/schema";

export function FavoriteChannelCard({ channel }: { channel: FavoriteChannel }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await removeFavoriteChannelAction(channel.channelId);
    setRemoving(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <Star className="h-5 w-5 shrink-0 fill-action text-action" />
        <p className="min-w-0 flex-1 truncate text-sm font-medium">{channel.channelTitle}</p>
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="shrink-0 rounded-full p-2 text-muted hover:bg-background hover:text-action"
          aria-label="Retirer des favoris"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
