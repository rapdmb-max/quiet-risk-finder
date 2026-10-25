import type { Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { portfolioSummary, type Segment } from "./portfolio";

export const WEEK = 7 * 86_400_000;
export const RANGES = [6, 12, 26] as const;
export type Range = (typeof RANGES)[number];

type Unit = "money" | "count" | "days";
type Summary = ReturnType<typeof portfolioSummary>;

interface MetricDef {
  id: string;
  label: string;
  note: string;
  unit: Unit;
  /** Which direction of travel is good news for the team. */
  better: "up" | "down";
  /** Typical week-on-week move as a fraction of today's value. Positive means the metric grows. */
  weekly: number;
  /** Half-width of the wobble applied around that move. */
  wobble: number;
  segment: Segment;
  pick: (g: Summary) => number;
}

/**
 * History is sample data: the demo was seeded this week, so there are no real weekly snapshots yet.
 * Every series is generated backwards from the live figure, so the newest point is always today's
 * real number and the same inputs always draw the same line.
 */
export const METRICS: MetricDef[] = [
  { id: "accounts", label: "Accounts", note: "In the book", unit: "count", better: "up", weekly: 0.008, wobble: 0.5, segment: "all", pick: (g) => g.count },
  { id: "arr", label: "Total ARR", note: "Annual recurring revenue", unit: "money", better: "up", weekly: 0.011, wobble: 0.6, segment: "all", pick: (g) => g.arr },
  { id: "riskArr", label: "At-risk ARR", note: "High or rising accounts", unit: "money", better: "down", weekly: -0.02, wobble: 0.7, segment: "risk", pick: (g) => g.riskArr },
  { id: "unassigned", label: "Unassigned at risk", note: "Risk nobody owns", unit: "count", better: "down", weekly: -0.06, wobble: 0.8, segment: "unassigned", pick: (g) => g.unassignedCount },
  { id: "contactAge", label: "Avg. contact age", note: "Days since customer contact", unit: "days", better: "down", weekly: -0.02, wobble: 0.5, segment: "contacted", pick: (g) => g.averageContactAge ?? 0 },
  { id: "overdue", label: "No contact · 30+ days", note: "Contacted, gone quiet", unit: "count", better: "down", weekly: -0.03, wobble: 0.7, segment: "overdue", pick: (g) => g.overdueCount },
  { id: "never", label: "Never contacted", note: "No contact recorded", unit: "count", better: "down", weekly: -0.05, wobble: 0.9, segment: "never", pick: (g) => g.neverCount },
  { id: "waiting", label: "Awaiting replies", note: "Messages with no answer", unit: "count", better: "down", weekly: 0.01, wobble: 1.2, segment: "waiting", pick: (g) => g.waitingCount },
];

/** Stable pseudo-random in [0,1) so a metric and week always draw the same history. */
function rand(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h = Math.imul(h ^ (h >>> 15), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function round(unit: Unit, v: number) {
  if (unit === "days") return Math.round(Math.max(0, v) * 10) / 10;
  return Math.max(0, Math.round(v));
}

/** Walk back from today's live figure one week at a time, newest point last. */
export function weeklySeries(def: MetricDef, current: number, weeks: number, now = Date.now()): number[] {
  const points = [current];
  for (let i = 1; i < weeks; i++) {
    const wobble = (rand(`${def.id}:${i}:${weeks}`) - 0.5) * 2 * def.wobble * Math.abs(def.weekly);
    points.push(round(def.unit, points[i - 1] * (1 - def.weekly - wobble)));
  }
  return points.reverse();
}

/** Week-ending labels, oldest first, e.g. "4 Aug". */
export function weekLabels(weeks: number, now = Date.now()): string[] {
  return Array.from({ length: weeks }, (_, i) =>
    new Date(now - (weeks - 1 - i) * WEEK).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
  );
}

export type Trend = "improving" | "worsening" | "flat";

/** Judge a move by whether it helps the team, not by its sign. */
export function trendOf(delta: number, better: "up" | "down"): Trend {
  if (delta === 0) return "flat";
  return (better === "down" ? delta < 0 : delta > 0) ? "improving" : "worsening";
}

export interface MetricTrend {
  id: string;
  label: string;
  note: string;
  unit: Unit;
  better: "up" | "down";
  segment: Segment;
  value: number;
  delta: number;
  trend: Trend;
  points: number[];
  labels: string[];
}

export function analyticsTrends(list: Account[], items: Outreach[], weeks: Range = 12, now = Date.now()): MetricTrend[] {
  const g = portfolioSummary(list, items, now);
  return METRICS.map((def) => {
    const points = weeklySeries(def, def.pick(g), weeks, now);
    const value = points[points.length - 1] ?? 0;
    const delta = value - (points[points.length - Math.min(5, points.length)] ?? value);
    return {
      id: def.id, label: def.label, note: def.note, unit: def.unit, better: def.better, segment: def.segment,
      value, delta, trend: trendOf(delta, def.better), points, labels: weekLabels(weeks, now),
    };
  });
}

export function formatMetric(t: MetricTrend, format: (eur: number) => string) {
  if (t.unit === "money") return format(t.value);
  if (t.unit === "days") return `${t.value.toFixed(1)}d`;
  return String(Math.round(t.value));
}

export function formatDelta(t: MetricTrend, format: (eur: number) => string) {
  const sign = t.delta > 0 ? "+" : t.delta < 0 ? "−" : "";
  const abs = Math.abs(t.delta);
  if (t.unit === "money") return `${sign}${format(abs)}`;
  if (t.unit === "days") return `${sign}${abs.toFixed(1)}d`;
  return `${sign}${Math.round(abs)}`;
}
