import { ACCOUNTS_WATCHED, formatArr, type Account } from "@/data/accounts";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Props {
  list: Account[];
  onOpen: (id: string) => void;
}

const dot = { high: "bg-risk", rising: "bg-rising", calm: "bg-calm" } as const;

export function Portfolio({ list, onOpen }: Props) {
  const cur = useCurrency();
  const radar = list.filter((a) => a.underRadar && a.status === "open");
  return (
    <div className="pane-enter space-y-6">
      <div>
        <h1 className="headline">
          {radar.length === 0 ? "Nothing is slipping under the radar." : `${radar.length} account${radar.length === 1 ? "" : "s"} nobody is watching.`}
        </h1>
        <p className="mt-1 text-muted-ink">
          Every account Undertow reads, <span className="font-mono">{ACCOUNTS_WATCHED}</span> in total. This sample shows the <span className="font-mono">{list.length}</span> with signals.
        </p>
      </div>
      <section className="overflow-hidden rounded-lg border bg-panel">
        <div className="grid grid-cols-[1fr_80px_90px_90px] gap-3 border-b px-5 py-3 text-[13px] text-muted-ink">
          <span>Account</span><span className="text-right">ARR</span><span>Owner</span><span className="text-right">Last touch</span>
        </div>
        <ul className="divide-y">
          {list.map((a) => {
            const lvl = a.status === "handled" ? "calm" : a.level;
            return (
              <li key={a.id}>
                <button onClick={() => onOpen(a.id)} className="grid w-full grid-cols-[1fr_80px_90px_90px] items-center gap-3 px-5 py-3 text-left hover:bg-soft">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", dot[lvl])} />
                    <span className="truncate font-semibold">{a.name}</span>
                    {a.underRadar && a.status === "open" && <span className="shrink-0 text-[13px] font-semibold">· under the radar</span>}
                  </span>
                  <span className="text-right font-mono text-[13px]">{formatArr(a.arr, cur)}</span>
                  <span className="truncate text-[13px] text-muted-ink">{a.owner === "Unassigned" ? "Nobody" : a.owner}</span>
                  <span className={cn("text-right font-mono text-[13px]", a.lastTouchDays >= 30 ? "text-risk" : "text-muted-ink")}>{a.lastTouchDays}d</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
