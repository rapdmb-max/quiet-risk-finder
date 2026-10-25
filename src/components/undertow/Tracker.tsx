import { isStalled, STALL_DAYS, type Role } from "@/lib/brief";
import { cn } from "@/lib/utils";
import type { Outreach } from "@/data/outreach";

export { SEED_OUTREACH, type Outreach } from "@/data/outreach";


interface Props {
  items: Outreach[];
  role: Role;
  onReplied: (id: string) => void;
  onOpen: (accountId: string) => void;
  onEscalate: (o: Outreach) => void;
}

const ago = (d: number) => (d === 0 ? "today" : `${d}d ago`);

export function Tracker({ items, role, onReplied, onOpen, onEscalate }: Props) {
  const mine = role === "Marta" ? items : items.filter((i) => i.by === role);
  const stalled = mine.filter(isStalled);
  const waiting = mine.filter((i) => i.status === "waiting" && !isStalled(i));
  const done = mine.filter((i) => i.status === "replied");
  const groups: [string, string, Outreach[]][] = [
    ["Stalled", `No reply in ${STALL_DAYS}+ days. Time to escalate.`, stalled],
    ["Waiting on a reply", "Sent recently. Nothing to do yet.", waiting],
    ["Replied", "The customer answered. Undertow keeps watching.", done],
  ];
  return (
    <div className="pane-enter space-y-6">
      <div>
        <h2 className="text-[17px] font-semibold">
          {stalled.length > 0
            ? `${stalled.length} customer${stalled.length === 1 ? " has" : "s have"} gone quiet on ${role === "Marta" ? "the team" : "you"}.`
            : waiting.length === 0 ? "No one to chase." : `Waiting on ${waiting.length} repl${waiting.length === 1 ? "y" : "ies"}.`}
        </h2>
        <p className="mt-1 text-muted-ink">
          {role === "Marta" ? "Everything the team sent from Undertow, and where to step in." : "Everything you sent from Undertow, and who still hasn't answered."}
        </p>
      </div>
      {groups.map(([title, sub, list]) => (
        <section key={title} className="overflow-hidden rounded-lg border bg-panel">
          <div className="border-b px-5 py-3">
            <h2 className="font-semibold">{title} <span className="ml-1 font-mono text-[13px] text-muted-ink">{list.length}</span></h2>
            <p className="text-[13px] text-muted-ink">{sub}</p>
          </div>
          {list.length === 0 && <p className="p-5 text-muted-ink">Nothing here.</p>}
          <ul className="divide-y">
            {list.map((o) => {
              const st = isStalled(o);
              return (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <span className={cn("size-2 rounded-full", st ? "bg-risk" : o.status === "waiting" ? "bg-rising" : "bg-calm")} />
                  <button onClick={() => onOpen(o.accountId)} className="min-w-0 flex-1 text-left">
                    <span className="font-semibold hover:underline">{o.account}</span>
                    <span className="block text-[13px] text-muted-ink">
                      {o.by} → {o.to} · {o.channel}{o.pdf ? " · PDF attached" : ""}
                    </span>
                  </button>
                  <span className={cn("font-mono text-[13px]", st ? "text-risk" : "text-muted-ink")}>{ago(o.daysAgo)}</span>
                  {st && (
                    <button onClick={() => onEscalate(o)} className="spring-press rounded-md bg-ink px-3 py-1.5 text-[13px] font-semibold text-ink-foreground">
                      {role === "Marta" ? "Step in as Head of CS" : "Ask Marta to step in"}
                    </button>
                  )}
                  {o.status === "waiting" && (
                    <button onClick={() => onReplied(o.id)} className="spring-press rounded-md border px-3 py-1.5 text-[13px] hover:bg-soft">
                      Mark replied
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

