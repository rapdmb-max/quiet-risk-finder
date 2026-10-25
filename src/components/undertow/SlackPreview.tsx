import { useCurrency } from "@/lib/currency";
import { formatArr, type Account } from "@/data/accounts";
import { Logo } from "./Bits";

interface Props {
  open: Account[];
  onOpenBrief: () => void;
  onSeeWhy: (id: string) => void;
  onAssign: (id: string, owner: string) => void;
  onRemind: () => void;
  onReachOut: (id: string) => void;
}

function Bot({ time, children }: { time: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-t p-6 first:border-t-0">
      <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-ink text-ink-foreground">
        <Logo className="h-4 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p>
          <span className="font-semibold">Undertow</span>
          <span className="ml-2 text-meta text-muted-ink">{time}</span>
        </p>
        {children}
      </div>
    </div>
  );
}

const primary = "rounded-md bg-calm px-4 py-2 font-semibold text-ink-foreground hover:opacity-90";
const outline = "rounded-md border px-4 py-2 font-semibold hover:bg-soft";

export function SlackPreview({ open, onOpenBrief, onSeeWhy, onAssign, onRemind, onReachOut }: Props) {
  const currency = useCurrency();
  const quiet = open.filter((a) => a.lastTouchDays >= 30).length;
  const pequod = open.find((a) => a.id === "pequod");
  return (
    <div className="mx-auto max-w-[760px] overflow-hidden rounded-lg border bg-panel">
      <div className="border-b px-6 py-4">
        <span className="font-semibold"># cs-team</span> <span className="text-muted-ink">· Slack</span>
      </div>
      <Bot time="Mon 08:30">
        <p className="mt-1 leading-relaxed">
          Good morning Marta.{" "}
          <span className="font-semibold">
            {open.length === 0 ? "Nothing needs you this week." : `${open.length} account${open.length === 1 ? "" : "s"} need${open.length === 1 ? "s" : ""} you this week.`}
          </span>{" "}
          {quiet > 0 && `${quiet} haven't had a CSM touch in 30+ days.`}
        </p>
        <ol className="mt-3 list-decimal space-y-1.5 pl-6 leading-relaxed">
          {open.map((a) => (
            <li key={a.id}>
              <span className="font-semibold">{a.name}</span> ({formatArr(a.arr, currency)}): {a.reason.charAt(0).toLowerCase() + a.reason.slice(1)}
              {a.owner === "Unassigned" ? " · no owner" : ` · ${a.owner}`}
              <button onClick={() => onReachOut(a.id)} className="ml-2 rounded border px-2 py-0.5 text-meta font-semibold hover:bg-soft">
                Reach out
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-meta text-muted-ink">
          Why these: signals from Intercom, product usage, HubSpot and Slack, compared with each account's own normal.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={primary} onClick={onOpenBrief}>Open the brief</button>
          <button className={outline} onClick={onRemind}>Remind me tomorrow</button>
        </div>
      </Bot>
      <Bot time="Wed 14:12">
        <p className="mt-1 leading-relaxed">
          <span className="font-semibold">New: Pequod Analytics just moved to high risk.</span> Their champion, Lena Ortiz, changed jobs on LinkedIn and usage fell 30% this week.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={primary} onClick={() => onSeeWhy("pequod")}>See why</button>
          {pequod && pequod.owner !== "Devon" && (
            <button className={outline} onClick={() => onAssign("pequod", "Devon")}>Assign to Devon</button>
          )}
        </div>
      </Bot>
    </div>
  );
}
