import { z } from "zod";
import { CSMS, type Account } from "@/data/accounts";
import { isUnderRadar, type Role } from "./brief";

/**
 * Business rules for every action that changes saved data.
 * Pure functions: the server runs them before writing, tests run them directly.
 */

export const ROLES: Role[] = ["Marta", "Devon"];
const actor = z.enum(["Marta", "Devon"]);
const accountId = z.string().min(1).max(80);

export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("assign"), actor, accountId, owner: z.string().min(1).max(40) }).strict(),
  z.object({ type: z.literal("nudge"), actor, accountId }).strict(),
  z.object({ type: z.literal("reached_out"), actor, accountId }).strict(),
  z.object({ type: z.literal("not_a_risk"), actor, accountId }).strict(),
  z.object({ type: z.literal("reopen"), actor, accountId }).strict(),
  z.object({ type: z.literal("send"), actor, accountId, channel: z.enum(["Email", "Slack"]), to: z.string().min(1).max(80), pdf: z.boolean() }).strict(),
  z.object({ type: z.literal("replied"), actor, outreachId: z.string().min(1).max(80) }).strict(),
  z.object({ type: z.literal("reset"), actor }).strict(),
]);
export type Action = z.infer<typeof actionSchema>;

export type EventType = "assigned" | "nudged" | "reached_out" | "not_a_risk" | "reopened" | "emailed" | "messaged" | "replied";

export interface AccountPatch {
  owner?: string;
  status?: "open" | "handled";
  handled_reason?: "reached_out" | "not_a_risk" | "emailed" | null;
  handled_note?: string | null;
}

export type Decision =
  | { ok: true; patch: AccountPatch | null; event: { type: EventType; detail: string } }
  | { ok: false; status: 403 | 409 | 422; message: string };

const deny = (status: 403 | 409 | 422, message: string): Decision => ({ ok: false, status, message });

/** Who may touch an account: the Head of CS sees all, a CSM only the accounts they own. */
export function canAct(account: Pick<Account, "owner">, role: Role) {
  return role === "Marta" || account.owner === role;
}

export function decide(account: Account, action: Exclude<Action, { type: "replied" | "reset" }>): Decision {
  const { actor: role } = action;
  if (!canAct(account, role)) return deny(403, `${account.name} belongs to ${account.owner === "Unassigned" ? "nobody yet" : account.owner}. Only they or Marta can act on it.`);

  switch (action.type) {
    case "nudge": {
      if (account.owner === "Unassigned") return deny(422, "Assign an owner before nudging them.");
      return { ok: true, patch: null, event: { type: "nudged", detail: `nudged ${account.owner} in Slack` } };
    }
    case "assign": {
      if (role !== "Marta") return deny(403, "Only the Head of CS assigns owners.");
      if (!CSMS.includes(action.owner)) return deny(422, "Choose someone on the CS team.");
      if (account.owner === action.owner) return deny(409, `${account.name} is already with ${action.owner}.`);
      const removed = action.owner === "Unassigned";
      return { ok: true, patch: { owner: action.owner }, event: { type: "assigned", detail: removed ? `removed ${account.owner} as owner` : `assigned ${action.owner}` } };
    }
    case "reached_out":
    case "not_a_risk":
    case "send": {
      if (account.status === "handled") return deny(409, `${account.name} was already handled: ${account.handledNote ?? "no note"}.`);
      if (action.type === "reached_out")
        return { ok: true, patch: { status: "handled", handled_reason: "reached_out", handled_note: `${role} reached out · watching for 14 days` }, event: { type: "reached_out", detail: "reached out" } };
      if (action.type === "not_a_risk")
        return { ok: true, patch: { status: "handled", handled_reason: "not_a_risk", handled_note: "Marked not a real risk · signals weighted less" }, event: { type: "not_a_risk", detail: "marked not a real risk" } };
      // Email closes the loop on the account; a Slack note to a colleague doesn't.
      if (action.channel === "Email")
        return { ok: true, patch: { status: "handled", handled_reason: "emailed", handled_note: `${role} emailed ${action.to} · waiting on reply` }, event: { type: "emailed", detail: `emailed ${action.to}${action.pdf ? " with PDF" : ""}` } };
      return { ok: true, patch: null, event: { type: "messaged", detail: `messaged ${action.to} in Slack` } };
    }
    case "reopen": {
      if (account.status === "open") return deny(409, `${account.name} is already open.`);
      return { ok: true, patch: { status: "open", handled_reason: null, handled_note: null }, event: { type: "reopened", detail: "reopened" } };
    }
  }
}

/** Under the radar is never stored: it is derived from owner and last contact every time. */
export function withDerived(a: Omit<Account, "underRadar">): Account {
  return { ...a, underRadar: a.status === "open" && isUnderRadar(a) };
}
