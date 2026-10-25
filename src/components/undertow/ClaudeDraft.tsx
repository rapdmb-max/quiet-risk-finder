import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Sparkles, Square, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClaudeDraft({ accountId, onApply }: { accountId: string; onApply: (text: string) => void }) {
  const [pending, setPending] = useState(false);
  const [proposal, setProposal] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);

  async function generate() {
    if (abort.current) return;
    const controller = new AbortController();
    abort.current = controller;
    setPending(true); setProposal(""); setError(""); setComplete(false);
    try {
      const response = await fetch("/api/draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId }), signal: controller.signal });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.message ?? "Claude could not start this draft.");
      }
      if (!response.body) throw new Error("Claude returned no draft.");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (true) {
        const chunk = await reader.read();
        buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "delta") setProposal((text) => text + event.text);
          if (event.type === "error") throw new Error(event.message);
          if (event.type === "done") done = true;
        }
        if (chunk.done) break;
      }
      if (!done) throw new Error("The draft was interrupted. Your original message is unchanged.");
      setComplete(true);
    } catch (err) {
      if (controller.signal.aborted) setError("Draft stopped. Your original message is unchanged.");
      else setError(err instanceof Error ? err.message : "Claude could not complete this draft.");
    } finally { abort.current = null; setPending(false); }
  }

  return <div className="mt-3 border-t pt-3">
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="sm" className="text-[13px] font-normal" disabled={pending} onClick={generate}>
        {pending ? <LoaderCircle className="motion-safe:animate-spin" /> : <Sparkles />} {pending ? "Claude is drafting…" : "Draft with Claude"}
      </Button>
      {pending && <Button variant="outline" size="sm" className="text-[13px] font-normal" onClick={() => abort.current?.abort()}><Square /> Stop</Button>}
    </div>
    {proposal && <div className="mt-3">
      <p className="text-[13px] font-semibold text-muted-ink">Claude’s draft</p>
      <p className="mt-2 whitespace-pre-wrap leading-relaxed" aria-live="polite">{proposal}</p>
      {complete && <div className="mt-3 flex gap-2">
        <Button size="sm" className="text-[13px] font-normal" onClick={() => { onApply(proposal); setProposal(""); setComplete(false); }}><Check /> Use draft</Button>
        <Button variant="ghost" size="sm" className="text-[13px] font-normal" onClick={() => { setProposal(""); setComplete(false); }}><X /> Discard</Button>
      </div>}
    </div>}
    {error && <p role="alert" className="mt-2 text-[13px] text-muted-ink">{error}</p>}
  </div>;
}