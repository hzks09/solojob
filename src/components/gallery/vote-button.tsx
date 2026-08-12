"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { toggleVote } from "@/lib/actions/gallery";

export function VoteButton({ generationId, initialVotes }: { generationId: string; initialVotes: number }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!session?.user) {
      router.push("/login");
      return;
    }
    startTransition(async () => {
      const res = await toggleVote(generationId);
      setVoted(res.voted);
      setVotes((v) => v + (res.voted ? 1 : -1));
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white backdrop-blur"
    >
      <Heart className={cn("h-4 w-4", voted && "fill-current text-brand")} />
      {votes}
    </button>
  );
}
