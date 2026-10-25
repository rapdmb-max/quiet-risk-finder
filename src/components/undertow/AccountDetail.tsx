import { useState } from "react";
import { CSMS, formatArr, type Account } from "@/data/accounts";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { LevelTag, Sparkline, Tag, severityText } from "./Bits";
import { ClaudeDraft } from "./ClaudeDraft";
import type { ActivityItem } from "@/lib/undertow.server";
import { contactAge } from "@/lib/portfolio";
import { formatEmail } from "@/lib/email-format";
import { Button } from "@/components/ui/button";

interface Props {
  account: Account;
  onAssign: (owner: string) => void;
  onReachedOut: () => void;
  onNotRisk: () => void;
  onNotify: (msg: string) => void;
  emailConnected: boolean;
  onConnectEmail: () => void;
  onSend: (channel: "Email" | "Slack", to: string, pdf: boolean) => void;
  onReopen?: () => void;
  activity?: ActivityItem[];
  saving?: boolean;
}

export function AccountDetail({ account: a, onAssign, onReachedOut, onNotRisk, onNotify, emailConnected, onConnectEmail, onSend, onReopen, activity = [], saving = false }: Props) {
  const [copied, setCopied] = useState(false);
  const [channel, setChannel] = useState<"Email" | "Slack">("Email");
  const [pdf, setPdf] = useState(true);
  const [draft, setDraft] = useState(() => formatEmail(a.suggestion));
  const currency = useCurrency();
  const handled = a.status === "handled";
  const age = contactAge(a);
  const tools = new Set(a.signals.map((s) => s.source.split(" via ").pop())).size;
  const pointing = a.signals.filter((s) => s.severity !== "none").length;
  const firstName = a.suggestion.match(/^Hi (\w+)/)?.[1];


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
        <span className="font-mono">{age === null ? "Never contacted" : `${age}d ago`}</span> · owner: {a.owner === "Unassigned" ? "nobody" : a.owner}
      </p>

      {handled ? (
        <div className="mt-6 rounded-lg bg-calm-soft p-5">
          <p className="font-semibold text-calm">{a.handledNote}</p>
          <p className="mt-1">Undertow keeps watching and will flag it again only if the signals change.</p>
          {onReopen && (
            <button onClick={onReopen} disabled={saving} className="spring-press mt-3 rounded-md border bg-panel px-3 py-1.5 text-[13px] hover:bg-soft disabled:opacity-50">
              Reopen
            </button>
          )}
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="eyebrow">Reach out</h3>
              <div role="radiogroup" aria-label="Channel" className="flex rounded-md border p-0.5 text-[13px]">
                {(["Email", "Slack"] as const).map((c) => (
                  <Button variant="ghost" key={c} role="radio" aria-checked={channel === c} onClick={() => setChannel(c)}
                    className={cn("h-auto rounded px-3 py-1 text-[13px] font-normal", channel === c ? "bg-ink font-semibold text-ink-foreground hover:bg-ink hover:text-ink-foreground" : "text-muted-ink hover:text-ink")}>
                    {c === "Email" ? "Email Customer" : "Slack CSM"}
                  </Button>
                ))}
              </div>
            </div>
            <div className="mt-3 rounded-lg border p-5">
              <p className="text-[13px] text-muted-ink">
                To: {channel === "Email" ? `${firstName ?? "contact"} at ${a.name}` : a.owner === "Unassigned" ? "#cs-team (nudge the team to pick it up)" : `${a.owner} in Slack (nudge the owner)`}
              </p>
              <textarea
                aria-label="Message"
                value={channel === "Email" ? draft : `${a.name} needs attention: ${a.verdict}`}
                onChange={(e) => channel === "Email" && setDraft(e.target.value)}
                readOnly={channel === "Slack"}
                rows={channel === "Email" ? 8 : 4}
                className="mt-2 w-full resize-y rounded-md bg-soft p-3 leading-relaxed outline-none focus:outline-2 focus:outline-ink"
              />
              {channel === "Email" && <ClaudeDraft accountId={a.id} onApply={(text) => setDraft(formatEmail(text))} />}
              {channel === "Email" && emailConnected && (
                <label className="mt-3 flex items-center gap-2 text-[13px]">
                  <input type="checkbox" checked={pdf} onChange={(e) => setPdf(e.target.checked)} />
                  Attach account summary PDF (<span className="font-mono">{formatArr(a.arr, currency)}/yr</span>, usage, tickets)
                </label>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
                <div className="flex gap-2">
                  <button onClick={() => { navigator.clipboard?.writeText(channel === "Email" ? draft : `${a.name} needs attention: ${a.verdict}`); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
                    className="rounded-md border px-3 py-1.5 text-[13px] hover:bg-soft">{copied ? "Copied" : "Copy"}</button>
                  {channel === "Email" && !emailConnected ? (
                    <button onClick={onConnectEmail} className="spring-press rounded-md bg-ink px-3 py-1.5 text-[13px] font-semibold text-ink-foreground">Connect email</button>
                  ) : (
                    <button
                      onClick={() => onSend(channel, channel === "Email" ? (firstName ?? "contact") : a.owner === "Unassigned" ? "#cs-team" : a.owner, channel === "Email" && pdf)}
                      className="spring-press rounded-md bg-ink px-3 py-1.5 text-[13px] font-semibold text-ink-foreground"
                    >
                      {channel === "Email" ? "Send email" : "Send in Slack"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
            <label className="flex items-center gap-2 text-[13px] text-muted-ink">
              Owner
              <select
                value={a.owner}
                disabled={saving}
                onChange={(e) => onAssign(e.target.value)}
                className="rounded-md border bg-panel px-3 py-2 text-[15px] text-ink focus:outline-2 focus:outline-ink"
              >
                {CSMS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="ml-auto flex gap-2">
              <button onClick={onNotRisk} disabled={saving} className="disabled:opacity-50 spring-press rounded-md border px-4 py-2 hover:bg-soft">
                Not a real risk
              </button>
              <button onClick={onReachedOut} disabled={saving} className="disabled:opacity-50 spring-press rounded-md bg-ink px-4 py-2 font-semibold text-ink-foreground hover:opacity-90">
                I've reached out
              </button>
            </div>
          </div>
        </>
      )}

      {activity.length > 0 && (
        <section className="mt-8 border-t pt-6">
          <h3 className="eyebrow">Activity</h3>
          <ul className="mt-3 space-y-1.5 text-[13px]">
            {activity.map((e) => (
              <li key={e.id} className="flex justify-between gap-4">
                <span><span className="font-semibold">{e.actor}</span> {e.detail}</span>
                <span className="shrink-0 font-mono text-muted-ink">{since(e.at)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}

const words: Record<number, string> = { 1: "One", 2: "Two", 3: "Three", 4: "Four", 5: "Five" };

function since(iso: string) {
  const min = Math.round((Date.now() - Date.parse(iso)) / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`;
}
