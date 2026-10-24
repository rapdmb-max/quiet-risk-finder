import { cn } from "@/lib/utils";

export interface Outreach {
  id: string;
  accountId: string;
  account: string;
  channel: "Email" | "Slack";
  to: string;
  by: string;
  when: string;
  pdf: boolean;
  status: "waiting" | "replied";
}

interface Props {
  items: Outreach[];
  onReplied: (id: string) => void;
  onOpen: (accountId: string) => void;
}

export function Tracker({ items, onReplied, onOpen }: Props) {
  const waiting = items.filter((i) => i.status === "waiting");
  const done = items.filter((i) => i.status === "replied");
  return (
    <div className="pane-enter space-y-6">
      <div>
        <h1 className="headline">
          {waiting.length === 0 ? "No one to chase." : `Waiting on ${waiting.length} repl${waiting.length === 1 ? "y" : "ies"}.`}
        </h1>
        <p className="mt-1 text-muted-ink">Everything the team sent from Undertow, by email or Slack, and who still hasn't answered.</p>
      </div>
      {[["Waiting on a reply", waiting], ["Replied", done]].map(([title, list]) => (
        <section key={title as string} className="overflow-hidden rounded-lg border bg-panel">
          <h2 className="border-b px-5 py-3 font-semibold">
            {title as string} <span className="ml-1 font-mono text-[13px] text-muted-ink">{(list as Outreach[]).length}</span>
          </h2>
          {(list as Outreach[]).length === 0 && <p className="p-5 text-muted-ink">Nothing here.</p>}
          <ul className="divide-y">
            {(list as Outreach[]).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <span className={cn("size-2 rounded-full", o.status === "waiting" ? "bg-rising" : "bg-calm")} />
                <button onClick={() => onOpen(o.accountId)} className="min-w-0 flex-1 text-left">
                  <span className="font-semibold hover:underline">{o.account}</span>
                  <span className="block text-[13px] text-muted-ink">
                    {o.by} → {o.to} · {o.channel}{o.pdf ? " · PDF attached" : ""}
                  </span>
                </button>
                <span className="font-mono text-[13px] text-muted-ink">{o.when}</span>
                {o.status === "waiting" && (
                  <button onClick={() => onReplied(o.id)} className="spring-press rounded-md border px-3 py-1.5 text-[13px] hover:bg-soft">
                    Mark replied
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export const SEED_OUTREACH: Outreach[] = [
  { id: "o1", accountId: "tessel", account: "Tessel Retail", channel: "Email", to: "ops lead", by: "Marta", when: "3d ago", pdf: false, status: "replied" },
  { id: "o2", accountId: "northvale", account: "Northvale Bank", channel: "Slack", to: "Aisha", by: "Marta", when: "1d ago", pdf: false, status: "waiting" },
];
