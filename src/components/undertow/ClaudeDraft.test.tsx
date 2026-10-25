import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ClaudeDraft } from "./ClaudeDraft";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("does not apply a generated draft until the human chooses it, including split stream frames", async () => {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({ start(controller) {
    controller.enqueue(encoder.encode('{"type":"del'));
    controller.enqueue(encoder.encode('ta","text":"Hi Sam"}\n{"type":"done"}\n'));
    controller.close();
  } });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(stream)));
  const apply = vi.fn();
  render(<ClaudeDraft accountId="brightline" onApply={apply} />);
  fireEvent.click(screen.getByRole("button", { name: "Draft with Claude" }));
  await screen.findByRole("button", { name: "Use draft" });
  expect(apply).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Use draft" }));
  expect(apply).toHaveBeenCalledExactlyOnceWith("Hi Sam");
});

it("ends credit-denied requests without replaying or overwriting the message", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ message: "Add workspace credits" }, { status: 402 }));
  vi.stubGlobal("fetch", fetchMock);
  const apply = vi.fn();
  render(<ClaudeDraft accountId="brightline" onApply={apply} />);
  fireEvent.click(screen.getByRole("button", { name: "Draft with Claude" }));
  await screen.findByRole("alert");
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(apply).not.toHaveBeenCalled();
});

it("propagates Stop before the first text and preserves the original message", async () => {
  let signal: AbortSignal | undefined;
  vi.stubGlobal("fetch", vi.fn((_url, init: RequestInit) => {
    signal = init.signal ?? undefined;
    return new Promise((_resolve, reject) => signal?.addEventListener("abort", () => reject(new DOMException("Stopped", "AbortError"))));
  }));
  const apply = vi.fn();
  render(<ClaudeDraft accountId="brightline" onApply={apply} />);
  fireEvent.click(screen.getByRole("button", { name: "Draft with Claude" }));
  fireEvent.click(screen.getByRole("button", { name: "Stop" }));
  await waitFor(() => expect(signal?.aborted).toBe(true));
  expect(apply).not.toHaveBeenCalled();
});