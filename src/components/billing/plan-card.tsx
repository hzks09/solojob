import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import type { PlanConfig } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function PlanCard({
  plan,
  highlighted,
  cta,
  className,
}: {
  plan: PlanConfig;
  highlighted?: boolean;
  cta: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn(highlighted && "border-2 border-brand", className)}>
      <CardContent className="pt-6">
        <h3 className="font-display text-lg font-black">{plan.name}</h3>
        <p className="mt-2 font-mono text-3xl font-semibold">
          {plan.priceMonthly}€<span className="text-sm font-normal text-muted"> /mois</span>
        </p>
        <ul className="mt-4 space-y-2 text-sm text-muted">
          {plan.features.map((f) => (
            <li key={f}>• {f}</li>
          ))}
        </ul>
        <div className="mt-6">{cta}</div>
      </CardContent>
    </Card>
  );
}
