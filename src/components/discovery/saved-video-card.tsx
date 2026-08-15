"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { removeSavedVideoAction } from "@/lib/actions/saved-videos";
import { formatDuration } from "@/lib/utils";
import type { Video } from "@/lib/db/schema";

export function SavedVideoCard({ video }: { video: Video }) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    setRemoving(true);
    await removeSavedVideoAction(video.id);
    setRemoving(false);
    router.refresh();
  }

  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- miniature YouTube externe */}
        <img src={video.thumbnailUrl} alt={video.title} className="h-16 w-28 shrink-0 rounded-lg object-cover" />
        <div className="min-w-0 flex-1">
          <a
            href={`https://www.youtube.com/watch?v=${video.youtubeVideoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-2 text-sm font-medium hover:underline"
          >
            {video.title}
          </a>
          <p className="mt-1 text-xs text-muted">
            {video.channelTitle} · {formatDuration(video.durationSeconds)}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRemove}
          disabled={removing}
          className="shrink-0 rounded-full p-2 text-muted hover:bg-background hover:text-action"
          aria-label="Retirer de la liste"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </CardContent>
    </Card>
  );
}
