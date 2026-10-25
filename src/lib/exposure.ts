import type { Account } from "@/data/accounts";

/**
 * Deterministic revenue exposure estimate (sample model, not a forecast).
 * churn probability: base by risk level, +5pts per bad signal, +2pts per warn signal,
 * +1pt per 5 days without CSM contact beyond 14 (never contacted counts as 60 days), capped 0.95.
 * Not-a-risk accounts are 0. Recovery if acted on this week: 65% base, −1pt per day of silence, floor 20%.
 */
const BASE = { high: 0.45, rising: 0.2, calm: 0.03 } as const;

export function churnProbability(a: Pick<Account, "level" | "signals" | "lastTouchDays" | "lastContactAt" | "handledReason">) {
  if (a.handledReason === "not_a_risk") return 0;
  const bad = a.signals.filter((s) => s.severity === "bad").length;
  const warn = a.signals.filter((s) => s.severity === "warn").length;
  const days = a.lastContactAt === null ? 60 : a.lastTouchDays;
  const silence = Math.max(0, Math.floor((days - 14) / 5)) * 0.01;
  return Math.min(0.95, round(BASE[a.level] + bad * 0.05 + warn * 0.02 + silence));
}

export function recoveryRate(a: Pick<Account, "lastTouchDays" | "lastContactAt">) {
  const days = a.lastContactAt === null ? 60 : a.lastTouchDays;
  return Math.max(0.2, round(0.65 - days * 0.01));
}

export function exposure(a: Account) {
  const p = churnProbability(a);
  const expectedLoss = Math.round(a.arr * p);
  const salvageable = Math.round(expectedLoss * recoveryRate(a));
  return { probability: p, expectedLoss, salvageable };
}

function round(n: number) { return Math.round(n * 100) / 100; }

/** Portfolio forecast inputs: sums of per-account estimates; only open, at-risk accounts count. */
export function portfolioProjection(list: Account[]) {
  const open = list.filter((a) => a.status !== "handled" && a.level !== "calm" && a.handledReason !== "not_a_risk");
  const rows = open.map((a) => ({ name: a.name, owner: a.owner, arr: a.arr, ...exposure(a) })).sort((x, y) => y.expectedLoss - x.expectedLoss);
  const sum = (r: typeof rows, k: "arr" | "expectedLoss" | "salvageable") => r.reduce((t, x) => t + x[k], 0);
  const unowned = rows.filter((r) => r.owner === "Unassigned");
  return {
    accounts: rows.length,
    riskArr: sum(rows, "arr"),
    expectedLoss: sum(rows, "expectedLoss"),
    salvageable: sum(rows, "salvageable"),
    unownedExpectedLoss: sum(unowned, "expectedLoss"),
    unownedCount: unowned.length,
    top: rows.slice(0, 5),
  };
}
