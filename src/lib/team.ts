import type { Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { filterAccounts, isStalled } from "./brief";
import { atRisk, contactAge } from "./portfolio";

export const NO_OWNER = "Unassigned";

export interface CsmLoad {
  owner: string;
  /** Accounts this person owns, including handled ones. */
  accounts: number;
  /** ARR of every account they own — the money they are responsible for. */
  arr: number;
  /** Share of the whole book's ARR, in percent. */
  arrShare: number;
  /** Open accounts that need action this week. */
  open: number;
  /** Share of the team's open work, in percent. */
  openShare: number;
  riskCount: number;
  riskArr: number;
  avgContactAge: number | null;
  contactedCount: number;
  overdue: number;
  never: number;
  waiting: number;
  stalled: number;
  handled: number;
}

export function loadFor(owner: string, list: Account[], items: Outreach[], now = Date.now()): CsmLoad {
  const mine = list.filter((a) => a.owner === owner);
  const ids = new Set(mine.map((a) => a.id));
  const risk = mine.filter(atRisk);
  const ages = mine.map((a) => contactAge(a, now)).filter((n): n is number => n !== null);
  const messages = items.filter((o) => ids.has(o.accountId));
  const waiting = messages.filter((o) => o.status === "waiting");
  const arr = mine.reduce((n, a) => n + a.arr, 0);
  return {
    owner,
    accounts: mine.length,
    arr,
    arrShare: 0,
    open: filterAccounts(mine, "week").length,
    openShare: 0,
    riskCount: risk.length,
    riskArr: risk.reduce((n, a) => n + a.arr, 0),
    avgContactAge: ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null,
    contactedCount: ages.length,
    overdue: ages.filter((n) => n >= 30).length,
    never: mine.length - ages.length,
    waiting: waiting.length,
    stalled: waiting.filter(isStalled).length,
    handled: mine.filter((a) => a.status === "handled").length,
  };
}

/** One row per owner, busiest first, with the no-owner pile kept last so it can never hide. */
export function teamLoad(list: Account[], items: Outreach[], now = Date.now()): CsmLoad[] {
  const owners = [...new Set(list.map((a) => a.owner))];
  const rows = owners.map((o) => loadFor(o, list, items, now));
  const totalArr = rows.reduce((n, r) => n + r.arr, 0);
  const totalOpen = rows.reduce((n, r) => n + r.open, 0);
  for (const r of rows) {
    r.arrShare = totalArr ? (r.arr / totalArr) * 100 : 0;
    r.openShare = totalOpen ? (r.open / totalOpen) * 100 : 0;
  }
  return rows.sort((a, b) =>
    Number(a.owner === NO_OWNER) - Number(b.owner === NO_OWNER) ||
    b.open - a.open || b.arr - a.arr || a.owner.localeCompare(b.owner),
  );
}

export function teamTotals(rows: CsmLoad[]) {
  const sum = (pick: (r: CsmLoad) => number) => rows.reduce((n, r) => n + pick(r), 0);
  const people = rows.filter((r) => r.owner !== NO_OWNER);
  const open = sum((r) => r.open);
  return {
    accounts: sum((r) => r.accounts),
    arr: sum((r) => r.arr),
    open,
    riskArr: sum((r) => r.riskArr),
    people: people.length,
    avgOpen: people.length ? open / people.length : 0,
    busiest: people.slice().sort((a, b) => b.open - a.open)[0],
    lightest: people.slice().sort((a, b) => a.open - b.open)[0],
    unowned: rows.find((r) => r.owner === NO_OWNER),
  };
}
