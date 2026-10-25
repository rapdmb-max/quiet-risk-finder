import { describe, expect, it } from "vitest";
import type { Account } from "@/data/accounts";
import { churnProbability, exposure, recoveryRate } from "./exposure";

const base = { id: "x", name: "X", arr: 100000, level: "high", underRadar: false, owner: "Devon", lastTouchDays: 10, reason: "", verdict: "", signals: [], timeline: [], suggestion: "", status: "open" } as Account;

describe("revenue exposure", () => {
  it("high risk with no signals and recent contact is 45%", () => expect(churnProbability(base)).toBe(0.45));
  it("adds 5pts per bad and 2pts per warn signal", () => {
    expect(churnProbability({ ...base, signals: [{ label: "a", value: "", severity: "bad", source: "" }, { label: "b", value: "", severity: "warn", source: "" }] })).toBe(0.52);
  });
  it("not a real risk is zero", () => expect(churnProbability({ ...base, handledReason: "not_a_risk" })).toBe(0));
  it("never contacted counts as 60 days of silence", () => {
    expect(churnProbability({ ...base, lastContactAt: null })).toBe(0.54);
    expect(recoveryRate({ lastTouchDays: 1, lastContactAt: null })).toBe(0.2);
  });
  it("expected loss is ARR × probability, salvageable is loss × recovery", () => {
    expect(exposure(base)).toEqual({ probability: 0.45, expectedLoss: 45000, salvageable: 24750 });
  });
});

import { portfolioProjection } from "./exposure";
describe("portfolio projection", () => {
  it("sums open at-risk accounts only and isolates unowned exposure", () => {
    const p = portfolioProjection([
      base,
      { ...base, id: "y", owner: "Unassigned" },
      { ...base, id: "z", level: "calm" },
      { ...base, id: "h", status: "handled" },
    ]);
    expect(p.accounts).toBe(2);
    expect(p.expectedLoss).toBe(90000);
    expect(p.unownedExpectedLoss).toBe(45000);
    expect(p.salvageable).toBe(49500);
  });
});
