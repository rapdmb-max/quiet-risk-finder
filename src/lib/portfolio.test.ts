import { describe, expect, it } from "vitest";
import { accounts } from "@/data/accounts";
import type { Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { scopeFor, filterAccounts } from "./brief";
import { atRisk, contactAge, matchesSegment, portfolioRows, portfolioSummary, NEVER_CONTACTED } from "./portfolio";

const base = accounts[0];
if (!base) throw new Error("Missing fixture");
const list: Account[] = [
  { ...base, id: "a", arr: 18000, owner: "Devon", lastTouchDays: 30 },
  { ...base, id: "b", arr: 52000, owner: "Unassigned", level: "rising", lastTouchDays: 10, status: "handled", handledReason: "emailed" },
  { ...base, id: "c", arr: 3000, owner: "Aisha", level: "calm", lastContactAt: null, timeline: [{ when: "Today", text: NEVER_CONTACTED, source: "HubSpot", warning: false }] },
];
const items: Outreach[] = [
  { id: "m1", accountId: "a", account: "A", channel: "Email", to: "Sam", by: "Devon", daysAgo: 5, pdf: false, status: "waiting" },
  { id: "m2", accountId: "a", account: "A", channel: "Email", to: "Sam", by: "Devon", daysAgo: 4, pdf: false, status: "waiting" },
];
describe("portfolio rules", () => {
  it("multiple owners and risk levels match any choice within each filter, and both filters together", () => {
    expect(portfolioRows(list, items, { segment: "all", query: "", owner: ["Devon", "Unassigned"], risk: ["high", "rising"], sort: "arr-desc" }).map((a) => a.id)).toEqual(["b", "a"]);
    expect(portfolioRows(list, items, { segment: "all", query: "", owner: ["Devon", "Aisha"], risk: ["high", "rising"], sort: "arr-desc" }).map((a) => a.id)).toEqual(["a"]);
    expect(portfolioRows(list, items, { segment: "all", query: "", owner: [], risk: [], sort: "arr-desc" }).length).toBe(3);
  });
  it("totals sum all accounts and risk ARR includes handled outreach", () => {
    expect(portfolioSummary(list, items)).toMatchObject({ count: 3, arr: 73000, riskCount: 2, riskArr: 70000, unassignedCount: 1, unassignedArr: 52000 });
    expect(portfolioSummary(list, items).riskPercent).toBeCloseTo(70000 / 73000 * 100);
  });
  it("average contact age excludes never-contacted accounts and reports its denominator", () => {
    expect(portfolioSummary(list, items)).toMatchObject({ averageContactAge: 20, contactedCount: 2, neverCount: 1, neverArr: 3000 });
    expect(portfolioSummary([list[2] as Account], []).averageContactAge).toBeNull();
  });
  it("30 days is overdue and never-contacted stays separate", () => {
    expect(portfolioSummary(list, items)).toMatchObject({ overdueCount: 1, overdueArr: 18000 });
    expect(matchesSegment(list[2] as Account, "overdue", items)).toBe(false);
  });
  it("waiting counts messages but stalled uses the 5-day boundary", () => {
    expect(portfolioSummary(list, items)).toMatchObject({ waitingCount: 2, waitingAccounts: 1, stalledCount: 1 });
  });
  it("Devon's totals and outreach include only his own accounts", () => {
    expect(portfolioSummary(scopeFor(list, "Devon"), items)).toMatchObject({ count: 1, arr: 18000, riskArr: 18000 });
    expect(portfolioSummary(scopeFor(list, "Devon"), [{ ...items[0] as Outreach, accountId: "b" }]).waitingCount).toBe(0);
  });
  it("marking not a risk excludes it but email handling alone does not", () => {
    expect(atRisk({ ...base, status: "handled", handledReason: "not_a_risk" })).toBe(false);
    expect(atRisk({ ...base, status: "handled", handledReason: "emailed" })).toBe(true);
  });
  it("contact dates advance from the stored absolute date", () => {
    expect(contactAge({ ...base, lastContactAt: "2026-09-25T09:00:00Z" }, Date.parse("2026-10-25T09:00:00Z"))).toBe(30);
  });
  it("healthy open accounts do not appear in the action queue", () => {
    expect(filterAccounts(list, "week").map((a) => a.id)).toEqual(["a"]);
  });
  it("filters combine and sort numerically without mutating the ledger", () => {
    expect(portfolioRows(list, items, { segment: "risk", query: "", owner: "all", risk: "all", sort: "arr-desc" }).map((a) => a.id)).toEqual(["b", "a"]);
    expect(portfolioRows(list, items, { segment: "risk", query: base.name, owner: "Devon", risk: "high", sort: "contact-oldest" }).map((a) => a.id)).toEqual(["a"]);
    expect(list.map((a) => a.id)).toEqual(["a", "b", "c"]);
  });
});