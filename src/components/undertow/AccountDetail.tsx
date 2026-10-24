import { useState } from "react";
import { CSMS, formatArr, type Account } from "@/data/accounts";
import { cn } from "@/lib/utils";
import { LevelTag, Sparkline, Tag, severityText } from "./Bits";

interface Props {
  account: Account;
  onAssign: (owner: string) => void;
  onReachedOut: () => void;
  onNotRisk: () => void;
}

export function AccountDetail({ account: a, onAssign, onReachedOut, onNotRisk }: Props) {
  const [copied, setCopied] = useState(false);
  const handled = a.status === "handled";
  const tools = new Set(a.signals.map((s) => s.source.split(" via ").pop())).size;
  const pointing = a.signals.filter((s) => s.severity !== "none").length;

  return (
    <article aria-live="polite" className="rounded-lg border bg-panel p-6 sm:p-9">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="text-[26px] font-bold tracking-tight">{a.name}</h2>
        <div className="flex gap-2">
          {!handled && <LevelTag level={a.level} />}
          {handled && <LevelTag level="calm" />}
          {a.underRadar && !handled && <Tag solid>Under the radar</Tag>}
        </div>
      </header>
      <p className="mt-1 text-muted-ink">
        <span className="font-mono text-[14px]">{formatArr(a.arr)}/yr</span> · last CSM touch{" "}
        <span className="font-mono text-[14px]">{a.lastTouchDays} days ago</span> · owner:{" "}
        {a.owner === "Unassigned" ? "nobody" : a.owner}
      </p>

      {handled ? (
        <div className="mt-7 rounded-lg bg-calm-soft p-6">
          <p className="font-semibold text-calm">{a.handledNote}</p>
          <p className="mt-1">Undertow keeps watching and will flag it again only if the signals change.</p>
        </div>
      ) : (
        <div className={cn("mt-7 rounded-lg p-6", a.level === "high" ? "bg-risk-soft" : "bg-rising-soft")}>
          <p className="text-[17px] font-bold leading-snug">{a.verdict}</p>
          {pointing > 1 && (
            <p className="mt-2">
              {words[pointing] ?? pointing} signals, from {words[tools] ?? tools} tools, pointing the same way.
            </p>
          )}
        </div>
      )}

      <section className="mt-9">
        <h3 className="eyebrow">The signals, connected</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {a.signals.map((s) => (
            <div key={s.label} className="flex flex-col rounded-lg border p-4">
              <span className="text-[14px] text-muted-ink">{s.label}</span>
              <span className={cn("mt-1 text-[26px] font-bold tracking-tight", severityText[s.severity])}>{s.value}</span>
              {s.series && <div className="my-2"><Sparkline series={s.series} severity={s.severity} /></div>}
              <span className="mt-auto pt-2 font-mono text-[12px] text-muted-ink">{s.source}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <h3 className="eyebrow">What happened, in order</h3>
        <ol className="relative mt-4 space-y-5 border-l border-line pl-6">
          {a.timeline.map((e, i) => (
            <li key={i} className="relative">
              <span
                className={cn(
                  "absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2",
                  e.warning ? "border-risk bg-risk" : "border-muted-ink bg-panel",
                )}
              />
              <p className="font-mono text-[12px] text-muted-ink">{e.when}</p>
              <p className="mt-0.5">
                {e.text} <span className="ml-1 font-mono text-[12px] text-muted-ink">{e.source}</span>
              </p>
            </li>
          ))}
        </ol>
      </section>

      {!handled && (
        <>
          <section className="mt-9">
            <h3 className="eyebrow">Suggested next step</h3>
            <div className="mt-3 rounded-lg border border-dashed p-5">
              <p className="leading-relaxed">{a.suggestion}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-muted-ink">
                  A draft for you to edit and send yourself. Undertow never contacts customers.
                </p>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(a.suggestion);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="rounded-md border px-3 py-1.5 text-[13px] font-medium hover:bg-soft"
                >
                  {copied ? "Copied" : "Copy draft"}
                </button>
              </div>
            </div>
          </section>

          <div className="mt-9 flex flex-wrap items-center gap-3 border-t pt-6">
            <label className="flex items-center gap-2 text-[14px] text-muted-ink">
              Owner
              <select
                value={a.owner}
                onChange={(e) => onAssign(e.target.value)}
                className="rounded-md border bg-panel px-3 py-2 text-[15px] text-ink focus:outline-2 focus:outline-ink"
              >
                {CSMS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="ml-auto flex gap-2">
              <button onClick={onNotRisk} className="rounded-md border px-4 py-2 font-medium hover:bg-soft">
                Not a real risk
              </button>
              <button onClick={onReachedOut} className="rounded-md bg-ink px-4 py-2 font-semibold text-ink-foreground hover:opacity-90">
                I've reached out
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

const words: Record<number, string> = { 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five" };
