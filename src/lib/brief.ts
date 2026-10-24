import type { Account } from "@/data/accounts";

export type Filter = "week" | "radar" | "handled";

export function filterAccounts(list: Account[], filter: Filter) {
  if (filter === "handled") return list.filter((a) => a.status === "handled");
  const open = list.filter((a) => a.status === "open");
  if (filter === "radar") return open.filter((a) => a.underRadar);
  return open;
}

export function counts(list: Account[]) {
  return {
    week: filterAccounts(list, "week").length,
    radar: filterAccounts(list, "radar").length,
    handled: filterAccounts(list, "handled").length,
  };
}

export function headline(list: Account[]) {
  const open = filterAccounts(list, "week");
  const n = open.length;
  const m = open.filter((a) => a.lastTouchDays >= 30 && a.owner === "Unassigned").length;
  if (n === 0) return { lead: "You're clear for this week.", tail: "Nothing needs you right now." };
  const lead = `${n} account${n === 1 ? "" : "s"} need${n === 1 ? "s" : ""} you this week.`;
  const tail = m === 0 ? "" : `${m} of them nobody has looked at in a month.`;
  return { lead, tail };
}

/** Under the radar = no owner and no CSM contact in 30+ days. */
export function isUnderRadar(a: Pick<Account, "owner" | "lastTouchDays">) {
  return a.owner === "Unassigned" && a.lastTouchDays >= 30;
}

/** Numbers for the At a glance page. Revenue at risk = ARR of open (not handled) flagged accounts. */
export function glance(list: Account[]) {
  const open = filterAccounts(list, "week");
  const workload: Record<string, number> = {};
  for (const a of open) if (a.owner !== "Unassigned") workload[a.owner] = (workload[a.owner] ?? 0) + 1;
  return {
    open: open.length,
    high: open.filter((a) => a.level === "high").length,
    arrAtRisk: open.reduce((s, a) => s + a.arr, 0),
    unowned: open.filter((a) => a.owner === "Unassigned"),
    workload,
  };
}
