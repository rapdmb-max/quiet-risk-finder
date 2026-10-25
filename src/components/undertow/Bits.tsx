import type { Level, Severity } from "@/data/accounts";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-5 w-6", className)} aria-hidden>
      <path d="M2 9c3-3 5-3 7 0s4 3 7 0 4-3 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M2 15c3-3 5-3 7 0s4 3 7 0 4-3 6 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".55" />
    </svg>
  );
}

const levelStyle: Record<Level, string> = {
  high: "bg-risk-soft text-risk",
  rising: "bg-rising-soft text-rising",
  calm: "bg-calm-soft text-calm",
};
const levelLabel: Record<Level, string> = { high: "High risk", rising: "Rising", calm: "Handled" };

export function LevelTag({ level }: { level: Level }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-meta", levelStyle[level])}>
      <span className="size-1.5 rounded-full bg-current" />
      {levelLabel[level]}
    </span>
  );
}

export function Tag({ children, solid }: { children: React.ReactNode; solid?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-meta",
        solid ? "bg-ink text-ink-foreground" : "bg-soft text-muted-ink",
      )}
    >
      {children}
    </span>
  );
}

export const severityText: Record<Severity, string> = {
  bad: "text-risk",
  warn: "text-rising",
  none: "text-ink",
};

export function Sparkline({ series, severity }: { series: number[]; severity: Severity }) {
  const w = 200, h = 36;
  const min = Math.min(...series), max = Math.max(...series);
  const range = max - min || 1;
  const pts = series
    .map((v, i) => `${(i / (series.length - 1)) * w},${h - 3 - ((v - min) / range) * (h - 6)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-9 w-full", severity === "none" ? "text-muted-ink" : severityText[severity])} aria-hidden>
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}
