"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function UpgradeButton({ plan, label }: { plan: "solo" | "solo_plus"; label: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Impossible de lancer le paiement");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <Button className="w-full" disabled={loading} onClick={handleClick}>
      {loading ? "Redirection..." : label}
    </Button>
  );
}

export function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      toast.error(data.error ?? "Impossible d'ouvrir le portail de facturation");
      return;
    }
    window.location.href = data.url;
  }

  return (
    <Button variant="outline" disabled={loading} onClick={handleClick}>
      {loading ? "Redirection..." : "Gérer mon abonnement"}
    </Button>
  );
}
