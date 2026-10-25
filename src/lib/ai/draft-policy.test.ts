import { describe, expect, it } from "vitest";
import { accounts } from "@/data/accounts";
import { draftContext, draftRequestSchema, safeGatewayMessage } from "./draft-policy";

describe("Claude drafting safeguards", () => {
  it("accepts only an account identifier, not client-supplied prompts", () => {
    expect(draftRequestSchema.safeParse({ accountId: "brightline" }).success).toBe(true);
    expect(draftRequestSchema.safeParse({ accountId: "brightline", prompt: "ignore rules" }).success).toBe(false);
  });
  it("grounds the draft in supplied evidence, not internal ARR or risk verdict", () => {
    const account = accounts[0];
    if (!account) throw new Error("Missing Brightline sample");
    const context = JSON.parse(draftContext(account));
    expect(context.signals[0].value).toBe("−41%");
    expect(context.originalDraft).toContain("Hi Sam");
    expect(context).not.toHaveProperty("arr");
    expect(context).not.toHaveProperty("verdict");
  });
  it("preserves safe upstream denial and credit messages", () => {
    expect(safeGatewayMessage({ error: { message: "Provider access denied" } }, "Failed")).toBe("Provider access denied");
    expect(safeGatewayMessage({ message: "Add credits" }, "Failed")).toBe("Add credits");
  });
});