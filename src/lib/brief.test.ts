import { describe, expect, it } from "vitest";
import { accounts } from "@/data/accounts";
import { counts, headline, isUnderRadar } from "./brief";

describe("brief rules", () => {
  it("headline counts open accounts and month-untouched ones", () => {
    expect(headline(accounts)).toEqual({
      lead: "4 accounts need you this week.",
      tail: "2 of them nobody has looked at in a month.",
    });
  });
  it("tab counts match sample data", () => {
    expect(counts(accounts)).toEqual({ week: 4, radar: 2, handled: 1 });
  });
  it("assigning an owner removes under-the-radar", () => {
    expect(isUnderRadar({ owner: "Unassigned", lastTouchDays: 47 })).toBe(true);
    expect(isUnderRadar({ owner: "Devon", lastTouchDays: 47 })).toBe(false);
  });
  it("clear week when nothing open", () => {
    expect(headline([]).lead).toBe("You're clear for this week.");
  });
});

import { formatArr } from "@/data/accounts";
describe("currency switcher", () => {
  it("shows euros by default", () => expect(formatArr(18000)).toBe("€18k"));
  it("converts to dollars at 1.08", () => expect(formatArr(18000, "USD")).toBe("$19.4k"));
  it("converts to pounds at 0.85", () => expect(formatArr(18000, "GBP")).toBe("£15.3k"));
});

import { glance } from "./brief";
import { accounts as sample } from "@/data/accounts";
describe("glance", () => {
  it("revenue at risk sums open accounts only", () => {
    expect(glance(sample).arrAtRisk).toBe(18000 + 7800 + 52000 + 9600);
  });
  it("counts accounts with no owner", () => {
    expect(glance(sample).unowned.map((a) => a.id)).toEqual(["brightline", "pequod"]);
  });
  it("workload counts open accounts per CSM, excluding handled", () => {
    expect(glance(sample).workload).toEqual({ Aisha: 1, Devon: 1 });
  });
});
