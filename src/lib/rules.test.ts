import { describe, expect, it } from "vitest";
import { accounts } from "@/data/accounts";
import { actionSchema, decide, withDerived } from "./rules";

const byId = (id: string) => {
  const a = accounts.find((x) => x.id === id);
  if (!a) throw new Error(`missing ${id}`);
  return a;
};
const brightline = byId("brightline"); // high, no owner, untouched 47 days
const fernway = byId("fernway"); // owned by Devon
const northvale = byId("northvale"); // owned by Aisha
const tessel = byId("tessel"); // already handled

describe("action rules", () => {
  it("Portfolio ownership remains editable on handled accounts without reopening them", () => {
    expect(decide(tessel, { type: "assign", actor: "Marta", accountId: tessel.id, owner: "Devon" })).toMatchObject({ ok: true, patch: { owner: "Devon" } });
    expect(decide(tessel, { type: "assign", actor: "Devon", accountId: tessel.id, owner: "Devon" }).ok).toBe(false);
  });
  it("a nudge targets the assigned CSM and never changes account risk or contact state", () => {
    expect(decide(fernway, { type: "nudge", actor: "Marta", accountId: fernway.id })).toMatchObject({ ok: true, patch: null, event: { type: "nudged", detail: "nudged Devon in Slack" } });
    expect(decide(brightline, { type: "nudge", actor: "Marta", accountId: brightline.id })).toMatchObject({ ok: false, status: 422 });
    expect(decide(northvale, { type: "nudge", actor: "Devon", accountId: northvale.id })).toMatchObject({ ok: false, status: 403 });
  });
  it("only the Head of CS assigns owners, and only to the team", () => {
    expect(decide(brightline, { type: "assign", actor: "Marta", accountId: "brightline", owner: "Devon" })).toMatchObject({ ok: true, patch: { owner: "Devon" } });
    expect(decide(fernway, { type: "assign", actor: "Devon", accountId: "fernway", owner: "Aisha" })).toMatchObject({ ok: false, status: 403 });
    expect(decide(brightline, { type: "assign", actor: "Marta", accountId: "brightline", owner: "Sam Patel" })).toMatchObject({ ok: false, status: 422 });
  });

  it("a CSM can only act on accounts they own", () => {
    expect(decide(fernway, { type: "reached_out", actor: "Devon", accountId: "fernway" }).ok).toBe(true);
    expect(decide(northvale, { type: "reached_out", actor: "Devon", accountId: "northvale" })).toMatchObject({ ok: false, status: 403 });
  });

  it("handling needs a reason and can't happen twice", () => {
    expect(decide(brightline, { type: "not_a_risk", actor: "Marta", accountId: "brightline" })).toMatchObject({ ok: true, patch: { status: "handled", handled_reason: "not_a_risk" } });
    expect(decide(tessel, { type: "reached_out", actor: "Marta", accountId: "tessel" })).toMatchObject({ ok: false, status: 409 });
  });

  it("email closes the account; a Slack note to a colleague doesn't", () => {
    const email = decide(brightline, { type: "send", actor: "Marta", accountId: "brightline", channel: "Email", to: "Sam", pdf: true });
    const slack = decide(brightline, { type: "send", actor: "Marta", accountId: "brightline", channel: "Slack", to: "#cs-team", pdf: false });
    expect(email).toMatchObject({ ok: true, patch: { status: "handled", handled_reason: "emailed" }, event: { detail: "emailed Sam with PDF" } });
    expect(slack).toMatchObject({ ok: true, patch: null, event: { type: "messaged" } });
  });

  it("only handled accounts reopen, and reopening clears the reason", () => {
    expect(decide(tessel, { type: "reopen", actor: "Marta", accountId: "tessel" })).toMatchObject({ ok: true, patch: { status: "open", handled_reason: null } });
    expect(decide(brightline, { type: "reopen", actor: "Marta", accountId: "brightline" })).toMatchObject({ ok: false, status: 409 });
  });

  it("under the radar is derived from owner and last contact, never trusted from storage", () => {
    const { underRadar: _ignored, ...stored } = brightline;
    expect(withDerived(stored).underRadar).toBe(true);
    expect(withDerived({ ...stored, owner: "Devon" }).underRadar).toBe(false);
    expect(withDerived({ ...stored, status: "handled" }).underRadar).toBe(false);
  });

  it("rejects unknown actors and extra fields", () => {
    expect(actionSchema.safeParse({ type: "reset", actor: "Marta" }).success).toBe(true);
    expect(actionSchema.safeParse({ type: "reset", actor: "Mallory" }).success).toBe(false);
    expect(actionSchema.safeParse({ type: "reached_out", actor: "Marta", accountId: "x", status: "handled" }).success).toBe(false);
  });
});
