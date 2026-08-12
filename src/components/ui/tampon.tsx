import { cn } from "@/lib/utils";

export type TamponVariant = "brouillon" | "envoye" | "envoyee" | "accepte" | "payee" | "retard" | "refuse";

const CONFIG: Record<TamponVariant, { label: string; color: string; rotate: string; symbol: string }> = {
  brouillon: { label: "Brouillon", color: "var(--muted)", rotate: "-3deg", symbol: "" },
  envoye: { label: "Envoyé", color: "var(--brand)", rotate: "3deg", symbol: "→" },
  envoyee: { label: "Envoyée", color: "var(--brand)", rotate: "3deg", symbol: "→" },
  accepte: { label: "Accepté", color: "var(--accent)", rotate: "-4deg", symbol: "✓" },
  payee: { label: "Payée", color: "var(--accent)", rotate: "-5deg", symbol: "✓" },
  retard: { label: "En retard", color: "var(--action)", rotate: "-3deg", symbol: "!" },
  refuse: { label: "Refusé", color: "var(--muted)", rotate: "4deg", symbol: "×" },
};

/**
 * Élément signature de SoloJob : un statut = un tampon encré, pas un badge
 * SaaS pastel. `animate` ne rejoue l'effet "apposé" que si l'utilisateur n'a
 * pas demandé de réduire les animations (voir .tampon-pose dans globals.css).
 */
export function Tampon({
  variant,
  animate = false,
  className,
}: {
  variant: TamponVariant;
  animate?: boolean;
  className?: string;
}) {
  const { label, color, rotate, symbol } = CONFIG[variant];

  return (
    <span
      className={cn(
        "relative inline-block rounded-[5px] border-[3px] px-3 py-1 font-display text-xs font-black uppercase tracking-wide",
        animate && "tampon-pose",
        className
      )}
      style={{ color, borderColor: color, transform: `rotate(${rotate})`, ["--tampon-rotate" as string]: rotate }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[3px] rounded-[2px] border opacity-50"
        style={{ borderColor: color }}
      />
      {symbol && <span aria-hidden>{symbol} </span>}
      {label}
    </span>
  );
}
