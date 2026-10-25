import type { Account, Level } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { isStalled } from "./brief";

export type Segment = "all" | "risk" | "unassigned" | "contacted" | "overdue" | "never" | "waiting" | "stalled";
export type Sort = "risk" | "arr-desc" | "arr-asc" | "contact-oldest" | "contact-newest" | "name-asc" | "name-desc";
export const DAY = 86_400_000;
export const NEVER_CONTACTED = "No customer contact recorded";

/** Handling is workflow state, not evidence that risk is resolved. */
export function atRisk(a: Account) {
  return a.level !== "calm" && a.handledReason !== "not_a_risk";
}
export function contactAge(a: Account, now = Date.now()): number | null {
  if (a.lastContactAt === null || a.timeline.some((e) => e.text === NEVER_CONTACTED)) return null;
  if (a.lastContactAt) {
    const time = Date.parse(a.lastContactAt);
    if (Number.isFinite(time)) return Math.max(0, Math.floor((now - time) / DAY));
  }
  return a.lastTouchDays;
}
export function outreachFor(a: Account, items: Outreach[]) {
  return items.filter((o) => o.accountId === a.id);
}
export function matchesSegment(a: Account, segment: Segment, items: Outreach[], now = Date.now()) {
  const age = contactAge(a, now);
  switch (segment) {
    case "risk": return atRisk(a);
    case "unassigned": return atRisk(a) && a.owner === "Unassigned";
    case "contacted": return age !== null;
    case "overdue": return age !== null && age >= 30;
    case "never": return age === null;
    case "waiting": return outreachFor(a, items).some((o) => o.status === "waiting");
    case "stalled": return outreachFor(a, items).some(isStalled);
    default: return true;
  }
}
export function portfolioSummary(list: Account[], items: Outreach[], now = Date.now()) {
  const sum = (rows: Account[]) => rows.reduce((n, a) => n + a.arr, 0);
  const risk = list.filter(atRisk);
  const unassigned = risk.filter((a) => a.owner === "Unassigned");
  const ages = list.map((a) => contactAge(a, now)).filter((n): n is number => n !== null);
  const overdue = list.filter((a) => matchesSegment(a, "overdue", items, now));
  const never = list.filter((a) => matchesSegment(a, "never", items, now));
  const ids = new Set(list.map((a) => a.id));
  const waiting = items.filter((o) => ids.has(o.accountId) && o.status === "waiting");
  const arr = sum(list);
  return { count: list.length, arr, riskCount: risk.length, riskArr: sum(risk), riskPercent: arr ? sum(risk) / arr * 100 : 0,
    unassignedCount: unassigned.length, unassignedArr: sum(unassigned), contactedCount: ages.length,
    averageContactAge: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
    overdueCount: overdue.length, overdueArr: sum(overdue), neverCount: never.length, neverArr: sum(never),
    waitingCount: waiting.length, stalledCount: waiting.filter(isStalled).length,
    waitingAccounts: new Set(waiting.map((o) => o.accountId)).size,
  };
}
export function portfolioRows(list: Account[], items: Outreach[], options: { segment: Segment; query: string; owner: string | string[]; risk: Level | "all" | string[]; sort: Sort }, now = Date.now()) {
  const rank = { high: 0, rising: 1, calm: 2 };
  return list.filter((a) => matchesSegment(a, options.segment, items, now)
    && a.name.toLowerCase().includes(options.query.trim().toLowerCase())
    && (Array.isArray(options.owner) ? options.owner.length === 0 || options.owner.includes(a.owner) : options.owner === "all" || a.owner === options.owner)
    && (Array.isArray(options.risk) ? options.risk.length === 0 || options.risk.includes(a.level) : options.risk === "all" || a.level === options.risk)).sort((a, b) => {
    if (options.sort === "name-asc") return a.name.localeCompare(b.name);
    if (options.sort === "name-desc") return b.name.localeCompare(a.name);
    if (options.sort === "arr-desc") return b.arr - a.arr || a.name.localeCompare(b.name);
    if (options.sort === "arr-asc") return a.arr - b.arr || a.name.localeCompare(b.name);
    if (options.sort.startsWith("contact")) {
      const aa = contactAge(a, now); const bb = contactAge(b, now);
      if (aa === null || bb === null) return aa === bb ? a.name.localeCompare(b.name) : aa === null ? -1 : 1;
      return (options.sort === "contact-oldest" ? bb - aa : aa - bb) || a.name.localeCompare(b.name);
    }
    return rank[a.level] - rank[b.level] || b.arr - a.arr || a.name.localeCompare(b.name);
  });
}