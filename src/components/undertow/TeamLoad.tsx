import { formatArr, type Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { useCurrency } from "@/lib/currency";
import { NO_OWNER, teamLoad, teamTotals, type CsmLoad } from "@/lib/team";
import type { Role } from "@/lib/brief";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function Stat({ label, value, className }: { label: string; value: string; className?: string | undefined }) {
  return (
    <div>
      <dt className="text-meta text-muted-ink">{label}</dt>
      <dd className={cn("mt-0.5 font-mono text-title", className)}>{value}</dd>
    </div>
  );
}

function CsmCard({ r, role, onOpen }: { r: CsmLoad; role: Role; onOpen: (owner: string) => void }) {
  const cur = useCurrency();
  const unowned = r.owner === NO_OWNER;
  const title = unowned ? "No owner" : r.owner;
  const tag = unowned ? "Needs assigning" : r.owner === "Marta" ? "Head of CS" : "CSM";
  return (
    <article className={cn("flex flex-col gap-4 rounded-lg border bg-panel p-5", unowned && "border-dashed")}>
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="flex items-baseline gap-2 text-title font-semibold">
          {title}
          <span className="text-meta font-normal text-muted-ink">{tag}</span>
        </h3>
        <span className="font-mono text-meta text-muted-ink">{Math.round(r.arrShare)}% of book ARR</span>
      </header>

      <div>
        <span className="eyebrow">ARR responsible</span>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="font-mono text-headline leading-none">{formatArr(r.arr, cur)}</span>
          <span className="font-mono text-meta text-muted-ink">{r.accounts} accounts</span>
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between text-meta">
          <span className="text-muted-ink">Needs action this week</span>
          <span className="font-mono">{r.open} open · {Math.round(r.openShare)}% of team work</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-soft">
          <div className={cn("h-full rounded-full", unowned ? "bg-risk" : "bg-ink")} style={{ width: `${Math.max(r.open ? 2 : 0, r.openShare)}%` }} />
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-x-4 gap-y-3 border-t pt-4">
        <Stat label="At risk" value={String(r.riskCount)} className={r.riskCount ? "text-risk" : undefined} />
        <Stat label="At-risk ARR" value={formatArr(r.riskArr, cur)} />
        <Stat label="Avg contact" value={r.avgContactAge === null ? "—" : `${r.avgContactAge.toFixed(1)}d`} />
        <Stat label="30+ days" value={String(r.overdue)} className={r.overdue ? "text-risk" : undefined} />
        <Stat label="Never contacted" value={String(r.never)} className={r.never ? "text-risk" : undefined} />
        <Stat label="Awaiting reply" value={String(r.waiting)} />
        <Stat label="Stalled 5+ days" value={String(r.stalled)} className={r.stalled ? "text-risk" : undefined} />
        <Stat label="Handled" value={String(r.handled)} className="text-muted-ink" />
        <Stat label="Contacted" value={`${r.contactedCount}/${r.accounts}`} className="text-muted-ink" />
      </dl>

      <Button variant="outline" className="mt-auto self-start" onClick={() => onOpen(r.owner)}>
        {unowned ? "See unowned accounts" : role === "Devon" ? "See my accounts" : `See ${r.owner}'s accounts`}
      </Button>
    </article>
  );
}

export function TeamLoad({
  list,
  outreach,
  role,
  load,
  onRetry,
  onOpenOwner,
}: {
  list: Account[];
  outreach: Outreach[];
  role: Role;
  load: "loading" | "ready" | "error";
  onRetry: () => void;
  onOpenOwner: (owner: string) => void;
}) {
  const rows = teamLoad(list, outreach);
  const totals = teamTotals(rows);

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[780px]">
          <h2 className="text-title font-semibold">Team load</h2>
          <p className="mt-1 text-meta text-muted-ink">
            Who owns what: ARR responsible, open work and contact coverage for each person.
            {role === "Devon" && " You're seeing your own book — the full team view belongs to the Head of CS."}
          </p>
        </div>
        {load === "ready" && role === "Marta" && (
          <p className="font-mono text-meta text-muted-ink">
            {totals.open} open · {totals.avgOpen.toFixed(1)} each · busiest {totals.busiest?.owner ?? "—"} · lightest {totals.lightest?.owner ?? "—"}
          </p>
        )}
      </div>

      {load === "error" && (
        <div className="mt-6 rounded-lg border bg-panel p-8 text-center text-muted-ink">
          <p>Couldn't load the team's numbers.</p>
          <Button variant="outline" className="mt-3" onClick={onRetry}>Try again</Button>
        </div>
      )}

      {load === "loading" && (
        <div className="mt-6 grid gap-3 xl:grid-cols-2">
          {[0, 1].map((i) => <div key={i} aria-hidden className="h-[300px] animate-pulse rounded-lg border bg-panel" />)}
        </div>
      )}

      {load === "ready" && (
        <>
          {rows.length > 1 && (
            <div className="mt-6 rounded-lg border bg-panel p-5">
              <span className="eyebrow">Workload split</span>
              <div className="mt-3 space-y-2">
                {rows.map((r) => (
                  <div key={r.owner} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 truncate text-meta">{r.owner === NO_OWNER ? "No owner" : r.owner}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-soft">
                      <div className={cn("h-full rounded-full", r.owner === NO_OWNER ? "bg-risk" : "bg-ink")} style={{ width: `${Math.max(r.open ? 2 : 0, r.openShare)}%` }} />
                    </div>
                    <span className="w-20 shrink-0 text-right font-mono text-meta text-muted-ink">{r.open} open</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            {rows.map((r) => <CsmCard key={r.owner} r={r} role={role} onOpen={onOpenOwner} />)}
          </div>
        </>
      )}
    </section>
  );
}
