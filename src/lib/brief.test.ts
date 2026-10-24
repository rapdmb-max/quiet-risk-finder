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
