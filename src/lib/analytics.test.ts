import { describe, expect, it } from "vitest";
import { formatArr } from "@/data/accounts";
import { accounts } from "@/data/accounts";
import type { Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { analyticsTrends, formatDelta, formatMetric, trendOf, weeklySeries, weekLabels } from "./analytics";
import { portfolioSummary, NEVER_CONTACTED } from "./portfolio";

const base = accounts[0];
if (!base) throw new Error("Missing fixture");

const NOW = Date.parse("2026-10-25T09:00:00.000Z");
const DAY = 86_400_000;
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();
const never = [{ when: "Today", text: NEVER_CONTACTED, source: "HubSpot", warning: false }];

const list: Account[] = [
  { ...base, id: "a", name: "A", arr: 18000, owner: "Devon", level: "high", lastTouchDays: 40, lastContactAt: ago(40), status: "open", handledReason: null },
  { ...base, id: "b", name: "B", arr: 12000, owner: "Devon", level: "calm", lastTouchDays: 4, lastContactAt: ago(4), status: "open", handledReason: null },
  { ...base, id: "c", name: "C", arr: 50000, owner: "Marta", level: "rising", lastTouchDays: 2, lastContactAt: ago(2), status: "open", handledReason: null },
  { ...base, id: "d", name: "D", arr: 30000, owner: "Marta", level: "high", lastTouchDays: 8, lastContactAt: ago(8), status: "handled", handledReason: "not_a_risk" },
  { ...base, id: "e", name: "E", arr: 9000, owner: "Unassigned", level: "high", lastTouchDays: 60, lastContactAt: null, timeline: never, status: "open", handledReason: null },
];
const items: Outreach[] = [
  { id: "m1", accountId: "a", account: "A", channel: "Email", to: "ops", by: "Devon", daysAgo: 6, pdf: false, status: "waiting" },
  { id: "m2", accountId: "c", account: "C", channel: "Slack", to: "Aisha", by: "Marta", daysAgo: 2, pdf: false, status: "waiting" },
];
const live = portfolioSummary(list, items, NOW);
const trends = analyticsTrends(list, items, 12, NOW);
const pick = (id: string) => {
  const t = trends.find((x) => x.id === id);
  if (!t) throw new Error(`Missing metric ${id}`);
  return t;
};

describe("analytics rules", () => {
  it("every widget's newest point is today's live figure", () => {
    expect(pick("accounts").value).toBe(live.count);
    expect(pick("arr").value).toBe(live.arr);
    expect(pick("riskArr").value).toBe(live.riskArr);
    expect(pick("unassigned").value).toBe(live.unassignedCount);
    expect(pick("contactAge").value).toBe(live.averageContactAge);
    expect(pick("overdue").value).toBe(live.overdueCount);
    expect(pick("never").value).toBe(live.neverCount);
    expect(pick("waiting").value).toBe(live.waitingCount);
    for (const t of trends) {
      expect(t.points).toHaveLength(12);
      expect(t.points[t.points.length - 1]).toBe(t.value);
      expect(t.labels).toHaveLength(12);
    }
  });

  it("the same accounts and range always draw the same history", () => {
    expect(analyticsTrends(list, items, 12, NOW)).toEqual(trends);
    expect(analyticsTrends(list, items, 6, NOW).map((t) => t.points)).not.toEqual(trends.map((t) => t.points));
  });

  it("risk history starts above today's figure when the metric is falling", () => {
    const risk = pick("riskArr");
    expect(risk.points[0]).toBeGreaterThan(risk.value);
    expect(risk.better).toBe("down");
  });

  it("count widgets hold whole accounts, never fractions", () => {
    for (const t of trends.filter((x) => x.unit === "count")) {
      for (const p of t.points) expect(Number.isInteger(p)).toBe(true);
    }
  });

  it("change is measured against four weeks ago and judged by whether it helps", () => {
    const risk = pick("riskArr");
    expect(risk.delta).toBe(risk.value - risk.points[risk.points.length - 5]);
    expect(risk.trend).toBe(trendOf(risk.delta, "down"));
    expect(trendOf(-1, "down")).toBe("improving");
    expect(trendOf(-1, "up")).toBe("worsening");
    expect(trendOf(0, "down")).toBe("flat");
  });

  it("figures read the way the rest of the app writes them", () => {
    expect(formatMetric(pick("riskArr"), (n) => formatArr(n, "EUR"))).toBe(formatArr(live.riskArr, "EUR"));
    expect(formatMetric(pick("accounts"), (n) => formatArr(n, "EUR"))).toBe(String(live.count));
    expect(formatMetric(pick("contactAge"), (n) => formatArr(n, "EUR"))).toBe(`${live.averageContactAge?.toFixed(1)}d`);
    expect(formatDelta(pick("accounts"), (n) => formatArr(n, "EUR"))).toBe("+0");
    expect(formatDelta(pick("riskArr"), (n) => formatArr(n, "EUR"))).toMatch(/^−/);
  });

  it("a book with no at-risk accounts draws a flat line at zero", () => {
    const calm: Account[] = [{ ...base, id: "z", name: "Z", arr: 1000, owner: "Devon", level: "calm", lastTouchDays: 3, lastContactAt: ago(3), status: "open", handledReason: null }];
    const rows = analyticsTrends(calm, [], 6, NOW);
    expect(rows.find((t) => t.id === "riskArr")?.points).toEqual([0, 0, 0, 0, 0, 0]);
    expect(rows.find((t) => t.id === "riskArr")?.trend).toBe("flat");
  });

  it("week labels run oldest to newest and end today", () => {
    const labels = weekLabels(3, NOW);
    expect(labels).toHaveLength(3);
    expect(labels[2]).toBe(new Date(NOW).toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
    expect(weekLabels(12, NOW)[0]).toBe(new Date(NOW - 11 * DAY).toLocaleDateString("en-GB", { day: "numeric", month: "short" }));
  });

  it("history walks back from the figure it is given", () => {
    const def = { id: "x", label: "x", note: "x", unit: "count" as const, better: "down" as const, weekly: -0.02, wobble: 0.7, segment: "all" as const, pick: () => 0 };
    const points = weeklySeries(def, 40, 5, NOW);
    expect(points).toHaveLength(5);
    expect(points[4]).toBe(40);
    expect(points[0]).toBeGreaterThan(40);
  });
});
