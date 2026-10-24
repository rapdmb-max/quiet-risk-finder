import { CSMS, LAST_WEEK, formatArr, type Account } from "@/data/accounts";
import { glance } from "@/lib/brief";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Props {
  list: Account[];
  onOpen: (id?: string) => void;
  onAssign: (id: string, owner: string) => void;
}

function Delta({ now, before, money }: { now: number; before: number; money?: (n: number) => string }) {
  const d = now - before;
  if (d === 0) return <span className="text-[13px] text-muted-ink">Same as last week</span>;
  return (
    <span className={cn("text-[13px]", d > 0 ? "text-risk" : "text-calm")}>
      <span className="font-mono">{d > 0 ? "+" : "−"}{money ? money(Math.abs(d)) : Math.abs(d)}</span> vs last week
    </span>
  );
}

export function Glance({ list, onOpen, onAssign }: Props) {
  const cur = useCurrency();
  const g = glance(list);
  const money = (n: number) => formatArr(n, cur);
  const csms = CSMS.filter((c) => c !== "Unassigned");
  const max = Math.max(1, ...csms.map((c) => g.workload[c] ?? 0));

  return (
    <div className="pane-enter space-y-6">
      <p className="max-w-[720px] text-muted-ink">
        Undertow reads support tickets, product usage, CRM and Slack, and flags the quiet accounts about to churn. This is where your team stands this week.
      </p>

      <div className="grid gap-px overflow-hidden rounded-lg border bg-line sm:grid-cols-3">
        <Stat label="Revenue at risk" value={`${money(g.arrAtRisk)}/yr`} sub={<Delta now={g.arrAtRisk} before={LAST_WEEK.arrAtRisk} money={money} />} />
        <Stat label="Accounts needing you" value={String(g.open)} sub={<Delta now={g.open} before={LAST_WEEK.open} />} />
        <Stat label="With no owner" value={String(g.unowned.length)} risk={g.unowned.length > 0} sub={<Delta now={g.unowned.length} before={LAST_WEEK.unowned} />} />
      </div>

      <div className="grid gap-6 min-[900px]:grid-cols-2">
        <section className="rounded-lg border bg-panel p-6">
          <h2 className="text-[17px] font-semibold">Nobody owns these yet</h2>
          <p className="mt-1 text-[13px] text-muted-ink">Goal: every high-risk account has an owner by Monday noon.</p>
          {g.unowned.length === 0 ? (
            <p className="mt-4 text-calm">Every flagged account has an owner.</p>
          ) : (
            <ul className="mt-4 divide-y">
              {g.unowned.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                  <button onClick={() => onOpen(a.id)} className="min-w-0 flex-1 text-left hover:underline">
                    <span className="font-semibold">{a.name}</span>{" "}
                    <span className="font-mono text-[13px] text-muted-ink">{money(a.arr)}</span>
                  </button>
                  <select
                    aria-label={`Assign ${a.name}`}
                    defaultValue=""
                    onChange={(e) => onAssign(a.id, e.target.value)}
                    className="rounded-md border bg-panel px-2 py-1.5 text-[13px]"
                  >
                    <option value="" disabled>Assign to…</option>
                    {csms.map((c) => <option key={c} value={c}>{c} ({g.workload[c] ?? 0} open)</option>)}
                  </select>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border bg-panel p-6">
          <h2 className="text-[17px] font-semibold">Team workload</h2>
          <p className="mt-1 text-[13px] text-muted-ink">Flagged accounts each CSM owns right now.</p>
          <ul className="mt-4 space-y-3">
            {csms.map((c) => {
              const n = g.workload[c] ?? 0;
              return (
                <li key={c} className="grid grid-cols-[72px_1fr_24px] items-center gap-3">
                  <span>{c}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-soft">
                    <span className="block h-full rounded-full bg-ink transition-all duration-500 ease-spring" style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                  <span className="text-right font-mono text-[13px]">{n}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <button onClick={() => onOpen()} className="spring-press rounded-md bg-ink px-5 py-2.5 font-semibold text-ink-foreground hover:opacity-90">
        Open the daily breakdown
      </button>
    </div>
  );
}

function Stat({ label, value, sub, risk }: { label: string; value: string; sub: React.ReactNode; risk?: boolean }) {
  return (
    <div className="bg-panel p-6">
      <p className="text-[13px] text-muted-ink">{label}</p>
      <p className={cn("mt-1 font-mono text-[28px] font-semibold tracking-tight", risk && "text-risk")}>{value}</p>
      <p className="mt-1">{sub}</p>
    </div>
  );
}
