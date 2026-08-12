"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Un problème est survenu</h1>
      <p className="max-w-md text-sm text-muted">
        Le service a rencontré une erreur temporaire (souvent la base de données qui se réveille après une pause).
        Réessaie dans quelques secondes.
      </p>
      <Button onClick={reset}>Réessayer</Button>
    </main>
  );
}
