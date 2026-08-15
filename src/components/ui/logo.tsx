export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <rect x="8" y="8" width="104" height="104" rx="24" fill="var(--brand)" />
      <path d="M48 38 L86 60 L48 82 Z" fill="var(--action)" />
    </svg>
  );
}
