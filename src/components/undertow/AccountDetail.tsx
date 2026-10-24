import { useState } from "react";
import { CSMS, formatArr, type Account } from "@/data/accounts";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { LevelTag, Sparkline, Tag, severityText } from "./Bits";

interface Props {
  account: Account;
  onAssign: (owner: string) => void;
  onReachedOut: () => void;
  onNotRisk: () => void;
  onNotify: (msg: string) => void;
}

export function AccountDetail({ account: a, onAssign, onReachedOut, onNotRisk, onNotify }: Props) {
  const [copied, setCopied] = useState(false);
  const currency = useCurrency();
  const handled = a.status === "handled";
  const tools = new Set(a.signals.map((s) => s.source.split(" via ").pop())).size;
  const pointing = a.signals.filter((s) => s.severity !== "none").length;
  const ticketTrouble = a.signals.some((s) => s.source === "Intercom" && s.severity === "bad");
  const firstName = a.suggestion.match(/^Hi (\w+)/)?.[1];
  const mailto = `mailto:?subject=${encodeURIComponent(`${a.name}: checking in`)}&body=${encodeURIComponent(a.suggestion)}`;

  const ctas = [
    { label: "Post to Slack", hint: `#cs-team gets the verdict and signals`, run: () => onNotify(`Posted ${a.name} to #cs-team.`) },
    { label: "Open draft in email", hint: "Pre-filled, you review and send", href: mailto },
    { label: "Schedule sponsor sync", hint: `Agenda from the ${pointing} signals`, run: () => onNotify(`Sync with ${firstName ?? "their sponsor"} added to your calendar as a draft.`) },
    ...(ticketTrouble
      ? [{ label: "Escalate to engineering", hint: "Tickets attached, flagged as renewal risk", run: () => onNotify(`Escalated ${a.name}'s tickets to engineering.`) }]
      : []),
  ];

  return (
    <article aria-live="polite" className="pane-enter rounded-lg border bg-panel p-6 sm:p-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[28px] font-semibold leading-tight tracking-tight">{a.name}</h2>
        <div className="flex gap-2">
          <LevelTag level={handled ? "calm" : a.level} />
          {a.underRadar && !handled && <Tag solid>Under the radar</Tag>}
        </div>
      </header>
      <p className="mt-1 text-[13px] text-muted-ink">
        <span className="font-mono">{formatArr(a.arr, currency)}/yr</span> · last CSM touch{" "}
        <span className="font-mono">{a.lastTouchDays}d ago</span> · owner: {a.owner === "Unassigned" ? "nobody" : a.owner}
      </p>

      {handled ? (
        <div className="mt-6 rounded-lg bg-calm-soft p-5">
          <p className="font-semibold text-calm">{a.handledNote}</p>
          <p className="mt-1">Undertow keeps watching and will flag it again only if the signals change.</p>
        </div>
      ) : (
        <div className={cn("mt-6 rounded-lg p-5", a.level === "high" ? "bg-risk-soft" : "bg-rising-soft")}>
          <p className="text-[17px] font-semibold leading-snug">{a.verdict}</p>
          {pointing > 1 && (
            <p className="mt-1 text-muted-ink">
              {words[pointing] ?? pointing} signals, from {(words[tools] ?? String(tools)).toLowerCase()} tools, pointing the same way.
            </p>
          )}
        </div>
      )}

      {!handled && (
        <section className="mt-8">
          <h3 className="eyebrow">Act on it</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ctas.map((c) => {
              const inner = (
                <>
                  <span className="block font-semibold">{c.label}</span>
                  <span className="block text-[13px] text-muted-ink">{c.hint}</span>
                </>
              );
              const cls = "spring-press block rounded-md border px-4 py-3 text-left hover:bg-soft";
              return "href" in c && c.href ? (
                <a key={c.label} href={c.href} className={cls}>{inner}</a>
              ) : (
                <button key={c.label} onClick={c.run} className={cls}>{inner}</button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h3 className="eyebrow">The signals, connected</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {a.signals.map((s) => (
            <div key={s.label} className="flex flex-col rounded-lg border p-4">
              <span className="text-[13px] text-muted-ink">{s.label}</span>
              <span className={cn("mt-1 text-[17px] font-semibold", severityText[s.severity])}>{s.value}</span>
              {s.series && <div className="my-2"><Sparkline series={s.series} severity={s.severity} /></div>}
              <span className="mt-auto pt-2 font-mono text-[13px] text-muted-ink">{s.source}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="eyebrow">What happened, in order</h3>
        <ol className="relative mt-4 space-y-4 border-l border-line pl-6">
          {a.timeline.map((e, i) => (
            <li key={i} className="relative">
              <span
                className={cn(
                  "absolute -left-[31px] top-1.5 size-2.5 rounded-full border-2",
                  e.warning ? "border-risk bg-risk" : "border-muted-ink bg-panel",
                )}
              />
              <p className="font-mono text-[13px] text-muted-ink">{e.when} · {e.source}</p>
              <p className="mt-0.5">{e.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {!handled && (
        <>
          <section className="mt-8">
            <h3 className="eyebrow">Suggested message</h3>
            <div className="mt-3 rounded-lg border border-dashed p-5">
              <p className="leading-relaxed">{a.suggestion}</p>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="text-[13px] text-muted-ink">A draft for you to edit and send yourself. Undertow never contacts customers.</p>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(a.suggestion);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }}
                  className="rounded-md border px-3 py-1.5 text-[13px] hover:bg-soft"
                >
                  {copied ? "Copied" : "Copy draft"}
                </button>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
            <label className="flex items-center gap-2 text-[13px] text-muted-ink">
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
              <button onClick={onNotRisk} className="spring-press rounded-md border px-4 py-2 hover:bg-soft">
                Not a real risk <kbd className="kbd">X</kbd>
              </button>
              <button onClick={onReachedOut} className="spring-press rounded-md bg-ink px-4 py-2 font-semibold text-ink-foreground hover:opacity-90">
                I've reached out <kbd className="kbd kbd-inverse">E</kbd>
              </button>
            </div>
          </div>
        </>
      )}
    </article>
  );
}

const words: Record<number, string> = { 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five" };
