export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect x="16" y="16" width="88" height="88" rx="18" fill="var(--brand)" />
      <text
        x="60"
        y="76"
        textAnchor="middle"
        className="font-display"
        fontWeight={900}
        fontSize={46}
        fill="var(--brand-foreground)"
      >
        SJ
      </text>
      <rect x="34" y="86" width="52" height="6" rx="3" fill="var(--action)" />
    </svg>
  );
}
