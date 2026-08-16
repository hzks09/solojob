"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitSuggestionAction } from "@/lib/actions/suggestions";

export function SuggestionForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim() || loading) return;

    setLoading(true);
    const result = await submitSuggestionAction(value);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }

    toast.success("Vidéo proposée ! Elle rejoindra le catalogue après modération.");
    setValue("");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Colle une URL ou un ID YouTube"
        disabled={loading}
      />
      <Button type="submit" variant="action" disabled={loading || !value.trim()}>
        {loading ? "Vérification..." : "Proposer"}
      </Button>
    </form>
  );
}
