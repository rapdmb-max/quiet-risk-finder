import { z } from "zod";

export const draftRequestSchema = z.object({
  accountId: z.string().min(1).max(80),
}).strict();

export function safeGatewayMessage(body: unknown, fallback: string): string {
  if (!body || typeof body !== "object") return fallback;
  const value = body as { message?: unknown; error?: { message?: unknown } };
  const message = value.message ?? value.error?.message;
  return typeof message === "string" && message.length > 0 ? message.slice(0, 1000) : fallback;
}

export function draftContext(account: { name: string; signals: unknown[]; timeline: unknown[]; suggestion: string }) {
  return JSON.stringify({ name: account.name, signals: account.signals, timeline: account.timeline, originalDraft: account.suggestion });
}