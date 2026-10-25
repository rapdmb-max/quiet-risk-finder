import { describe, expect, it } from "vitest";
import { accounts } from "@/data/accounts";
import type { Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { filterAccounts, scopeFor } from "./brief";
import { NEVER_CONTACTED } from "./portfolio";
import { loadFor, teamLoad, teamTotals } from "./team";

const base = accounts[0];
if (!base) throw new Error("Missing fixture");

const NOW = Date.parse("2026-10-25T09:00:00.000Z");
const DAY = 86_400_000;
const ago = (days: number) => new Date(NOW - days * DAY).toISOString();
const never = [{ when: "Today", text: NEVER_CONTACTED, source: "HubSpot", warning: false }];

const list: Account[] = [
  { ...base, id: "a", name: "A", arr: 18000, owner: "Devon", level: "high", lastTouchDays: 40, lastContactAt: ago(40), status: "open", handledReason: null },
  { ...base, id: "b", name: "B", arr: 12000, owner: "Devon", level: "calm", lastTouchDays: 4, lastContactAt: ago(4), status: "open", handledReason: null },
  { ...base, id: "f", name: "F", arr: 5000, owner: "Devon", level: "rising", lastTouchDays: 1, lastContactAt: ago(1), status: "open", handledReason: null },
  { ...base, id: "c", name: "C", arr: 50000, owner: "Marta", level: "rising", lastTouchDays: 2, lastContactAt: ago(2), status: "open", handledReason: null },
  { ...base, id: "d", name: "D", arr: 30000, owner: "Marta", level: "high", lastTouchDays: 8, lastContactAt: ago(8), status: "handled", handledReason: "not_a_risk" },
  { ...base, id: "e", name: "E", arr: 9000, owner: "Unassigned", level: "high", lastTouchDays: 60, lastContactAt: null, timeline: never, status: "open", handledReason: null },
];

const items: Outreach[] = [
  { id: "m1", accountId: "a", account: "A", channel: "Email", to: "ops", by: "Devon", daysAgo: 6, pdf: false, status: "waiting" },
  { id: "m2", accountId: "c", account: "C", channel: "Slack", to: "Aisha", by: "Marta", daysAgo: 2, pdf: false, status: "waiting" },
  { id: "m3", accountId: "c", account: "C", channel: "Email", to: "ops", by: "Marta", daysAgo: 1, pdf: false, status: "replied" },
];

describe("team load rules", () => {
  it("ARR responsible is every account a person owns, including handled and calm ones", () => {
    expect(loadFor("Devon", list, items, NOW)).toMatchObject({ accounts: 3, arr: 35000, handled: 0 });
    expect(loadFor("Marta", list, items, NOW)).toMatchObject({ accounts: 2, arr: 80000, handled: 1 });
    expect(loadFor("Unassigned", list, items, NOW)).toMatchObject({ accounts: 1, arr: 9000 });
  });

  it("needs action per person is exactly the Triage definition for their own accounts", () => {
    for (const owner of ["Devon", "Marta", "Unassigned"] as const) {
      expect(loadFor(owner, list, items, NOW).open).toBe(filterAccounts(list.filter((a) => a.owner === owner), "week").length);
    }
    expect(loadFor("Devon", list, items, NOW).open).toBe(2);
    expect(loadFor("Marta", list, items, NOW).open).toBe(1);
  });

  it("a handled 'not a real risk' account stops counting towards its owner's risk", () => {
    expect(loadFor("Marta", list, items, NOW)).toMatchObject({ riskCount: 1, riskArr: 50000 });
  });

  it("average contact age excludes never-contacted accounts and counts them separately", () => {
    const devon = loadFor("Devon", list, items, NOW);
    expect(devon.avgContactAge).toBeCloseTo((40 + 4 + 1) / 3);
    expect(devon.contactedCount).toBe(3);
    expect(devon.overdue).toBe(1);
    expect(devon.never).toBe(0);
    const unowned = loadFor("Unassigned", list, items, NOW);
    expect(unowned).toMatchObject({ avgContactAge: null, contactedCount: 0, never: 1, overdue: 0 });
  });

  it("waiting counts messages and stalled uses the five-day boundary", () => {
    expect(loadFor("Devon", list, items, NOW)).toMatchObject({ waiting: 1, stalled: 1 });
    expect(loadFor("Marta", list, items, NOW)).toMatchObject({ waiting: 1, stalled: 0 });
  });

  it("shares are measured against the whole book and the no-owner pile stays last", () => {
    const rows = teamLoad(list, items, NOW);
    expect(rows.map((r) => r.owner)).toEqual(["Devon", "Marta", "Unassigned"]);
    expect(rows.reduce((n, r) => n + r.arrShare, 0)).toBeCloseTo(100);
    expect(rows.reduce((n, r) => n + r.openShare, 0)).toBeCloseTo(100);
    expect(rows.map((r) => Math.round(r.openShare))).toEqual([50, 25, 25]);
    expect(rows.map((r) => r.arr)).toEqual([35000, 80000, 9000]);
  });

  it("totals report the balance of load across the people who own accounts", () => {
    const totals = teamTotals(teamLoad(list, items, NOW));
    expect(totals).toMatchObject({ accounts: 6, arr: 124000, open: 4, people: 2, avgOpen: 2 });
    expect(totals.busiest?.owner).toBe("Devon");
    expect(totals.lightest?.owner).toBe("Marta");
    expect(totals.unowned?.accounts).toBe(1);
  });

  it("a CSM's own book has no workload split to compare", () => {
    const rows = teamLoad(scopeFor(list, "Devon"), items, NOW);
    expect(rows.map((r) => r.owner)).toEqual(["Devon"]);
    expect(rows[0]).toMatchObject({ arr: 35000, arrShare: 100, openShare: 100 });
  });
});
