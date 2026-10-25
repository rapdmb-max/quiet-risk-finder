import { useState } from "react";
import { formatArr, type Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { useCurrency } from "@/lib/currency";
import { RANGES, analyticsTrends, formatDelta, formatMetric, type MetricTrend, type Range } from "@/lib/analytics";
import type { Segment } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const tone: Record<MetricTrend["trend"], string> = {
  improving: "text-calm",
  worsening: "text-risk",
  flat: "text-muted-ink",
};

function arrow(delta: number) {
  return delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
}

/** Area + line drawn from the weekly points; the dot marks today's live figure. */
function TrendChart({ points, className }: { points: number[]; className: string }) {
  const w = 240;
  const h = 60;
  const pad = 7;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const xy = points.map((v, i) => [
    (i / (points.length - 1)) * w,
    h - pad - ((v - min) / range) * (h - pad * 2),
  ] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const lastY = h - pad - (((points[points.length - 1] ?? 0) - min) / range) * (h - pad * 2);
  return (
    <div className={cn("relative h-[60px] w-full", className)} aria-hidden>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path d={`${line} L${w} ${h} L0 ${h} Z`} fill="currentColor" opacity="0.09" />
        <path d={line} fill="none" stroke="currentColor" strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      <span
        className="absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current"
        style={{ left: `${(lx / w) * 100}%`, top: `${(ly / h) * 100}%` }}
      />
    </div>
  );
}

function MetricWidget({ t, onOpen }: { t: MetricTrend; onOpen: (segment: Segment) => void }) {
  const currency = useCurrency();
  const fmt = (eur: number) => formatArr(eur, currency);
  const last = t.labels[t.labels.length - 1];
  return (
    <button
      onClick={() => onOpen(t.segment)}
      className="spring-press flex flex-col gap-3 rounded-lg border bg-panel p-4 text-left transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="eyebrow">{t.label}</span>
        <span className={cn("font-mono text-meta", tone[t.trend])}>
          {arrow(t.delta)} {formatDelta(t, fmt)}
        </span>
      </span>
      <span className="font-mono text-headline leading-none">{formatMetric(t, fmt)}</span>
      <TrendChart points={t.points} className={tone[t.trend]} />
      <span className="flex items-baseline justify-between gap-2 text-meta text-muted-ink">
        <span>{t.note}</span>
        <span className="font-mono">{t.labels[0]} → {last}</span>
      </span>
    </button>
  );
}

export function Analytics({
  list,
  outreach,
  load,
  onRetry,
  onSummary,
}: {
  list: Account[];
  outreach: Outreach[];
  load: "loading" | "ready" | "error";
  onRetry: () => void;
  onSummary: (segment: Segment) => void;
}) {
  const [weeks, setWeeks] = useState<Range>(12);
  const trends = analyticsTrends(list, outreach, weeks);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[780px]">
          <h2 className="text-title font-semibold">Progress over time</h2>
          <p className="mt-1 text-meta text-muted-ink">
            One widget per portfolio metric. Weekly history is sample data — the newest figure on every line is today's live number.
            Change shown is versus four weeks ago.
          </p>
        </div>
        <div role="radiogroup" aria-label="History range" className="flex rounded-lg border bg-panel p-1">
          {RANGES.map((n) => (
            <button
              key={n}
              role="radio"
              aria-checked={weeks === n}
              onClick={() => setWeeks(n)}
              className={cn(
                "spring-press rounded-md px-3 py-1.5 font-mono text-meta",
                weeks === n ? "bg-ink text-ink-foreground" : "text-muted-ink hover:text-ink",
              )}
            >
              {n}w
            </button>
          ))}
        </div>
      </div>

      {load === "error" && (
        <div className="mt-6 rounded-lg border bg-panel p-8 text-center text-muted-ink">
          <p>Couldn't load the numbers behind these charts.</p>
          <Button variant="outline" className="mt-3" onClick={onRetry}>Try again</Button>
        </div>
      )}

      {load === "loading" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} aria-hidden className="h-[172px] animate-pulse rounded-lg border bg-panel" />
          ))}
        </div>
      )}

      {load === "ready" && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {trends.map((t) => (
            <MetricWidget key={t.id} t={t} onOpen={onSummary} />
          ))}
        </div>
      )}
    </section>
  );
}
