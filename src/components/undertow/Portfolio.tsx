import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search, X, Slack } from "lucide-react";
import { CSMS, formatArr, type Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import { useCurrency } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { contactAge, outreachFor, portfolioRows, portfolioSummary, type Segment, type Sort } from "@/lib/portfolio";
import { isStalled, type Role } from "@/lib/brief";
import { Button } from "@/components/ui/button";
import { MultiFilter } from "./MultiFilter";

interface Props { list: Account[]; outreach: Outreach[]; role: Role; segment: Segment; onSegmentChange: (segment: Segment) => void; summaryRevision: number; onOpen: (id: string) => void; load: "loading" | "ready" | "error"; onRetry: () => void; saving: boolean; onAssign: (id: string, owner: string) => void; onNudge: (account: Account) => void }
const labels: Record<Segment, string> = { all: "All accounts", risk: "At risk", unassigned: "Unassigned at risk", contacted: "Contact recorded", overdue: "No contact · 30+ days", never: "Never contacted", waiting: "Awaiting replies", stalled: "Stalled · 5+ days" };
const levels = { high: "High", rising: "Rising", calm: "Healthy" };
const dot = { high: "bg-risk", rising: "bg-rising", calm: "bg-calm" };

export function Portfolio({ list, outreach, role, segment, onSegmentChange: setSegment, summaryRevision, onOpen, load, onRetry, saving, onAssign, onNudge }: Props) {
  const cur = useCurrency();
  const [query, setQuery] = useState("");
  const [owner, setOwner] = useState<string[]>([]);
  const [risk, setRisk] = useState<string[]>([]);
  const [sort, setSort] = useState<Sort>("risk");
  useEffect(() => { setQuery(""); setOwner([]); setRisk([]); }, [summaryRevision]);
  const g = portfolioSummary(list, outreach);
  const rows = portfolioRows(list, outreach, { segment, query, owner, risk, sort });
  const filtered = segment !== "all" || query !== "" || owner.length > 0 || risk.length > 0;
  const reset = () => { setSegment("all"); setQuery(""); setOwner([]); setRisk([]); };
  return (
    <div className="pane-enter">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 flex-wrap items-baseline gap-3"><h2 className="text-[17px] font-semibold">{labels[segment]}</h2><span data-testid="portfolio-result" className="font-mono text-[13px] text-muted-ink">{rows.length} / {g.count} · {formatArr(rows.reduce((n, a) => n + a.arr, 0), cur)} ARR</span>
          {segment === "waiting" && g.stalledCount > 0 && <Button variant="link" onClick={() => setSegment("stalled")} className="h-auto p-0 text-[13px] font-normal">{g.stalledCount} stalled messages</Button>}
        </div>
        {filtered && <Button variant="ghost" onClick={reset} className="h-8 text-[13px] font-normal"><X />Clear filters</Button>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 border-b pb-4">
        <label className="relative min-w-48 flex-1 sm:max-w-80"><Search className="absolute left-3 top-2.5 size-4 text-muted-ink" /><span className="sr-only">Search portfolio</span><input aria-label="Search portfolio" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search accounts…" className="h-9 w-full rounded-md border bg-panel pl-9 pr-3 text-[13px] outline-none focus-visible:ring-1 focus-visible:ring-ring" /></label>
        {role === "Marta" && <MultiFilter label="Owner" values={owner} onChange={setOwner} options={CSMS.map((c) => ({ value: c, label: c }))}/>}
        <MultiFilter label="Risk" values={risk} onChange={setRisk} options={Object.entries(levels).map(([value, label]) => ({ value, label }))}/>
        <label className="ml-auto flex items-center gap-2 text-[13px] text-muted-ink">Sort<select aria-label="Sort accounts" value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 rounded-md border bg-panel px-2 text-ink"><option value="risk">Risk first</option><option value="arr-desc">ARR · highest first</option><option value="arr-asc">ARR · lowest first</option><option value="contact-oldest">Contact · oldest first</option><option value="contact-newest">Contact · newest first</option><option value="name-asc">Account · A–Z</option><option value="name-desc">Account · Z–A</option></select></label>
      </div>
      {load === "error" ? <div role="alert" className="py-16 text-center"><p>Portfolio couldn’t load.</p><Button variant="outline" onClick={onRetry} className="mt-3">Try again</Button></div> : load === "loading" ? <div aria-busy="true" className="py-16 text-muted-ink">Reading your accounts…</div> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] table-fixed text-left text-[13px]" aria-label="Portfolio accounts">
            <colgroup><col className="w-[19%]"/><col className="w-[9%]"/><col className="w-[8%]"/><col className="w-[25%]"/><col className="w-[11%]"/><col className="w-[14%]"/><col className="w-[10%]"/><col className="w-[4%]"/></colgroup>
            <thead className="text-muted-ink"><tr className="border-b"><th className="py-3 pr-3 font-normal">Account</th><th className="py-3 pr-3 font-normal" aria-sort={sort === "arr-desc" ? "descending" : sort === "arr-asc" ? "ascending" : "none"}><Button variant="ghost" className="h-auto p-0 text-[13px] font-normal" onClick={() => setSort(sort === "arr-desc" ? "arr-asc" : "arr-desc")}>ARR {sort === "arr-desc" ? <ArrowDown/> : sort === "arr-asc" ? <ArrowUp/> : <ArrowUpDown/>}</Button></th><th className="font-normal">Risk</th><th className="font-normal">Main signal</th><th className="font-normal">Owner</th><th className="font-normal"><Button variant="ghost" className="h-auto p-0 text-[13px] font-normal" onClick={() => setSort(sort === "contact-oldest" ? "contact-newest" : "contact-oldest")}>Last contact <ArrowUpDown/></Button></th><th className="font-normal">Outreach</th><th><span className="sr-only">Nudge owner</span></th></tr></thead>
            <tbody>{rows.map((a) => {
              const age = contactAge(a); const messages = outreachFor(a, outreach); const waiting = messages.filter((o) => o.status === "waiting"); const stalled = waiting.some(isStalled);
              const date = a.lastContactAt ? new Date(a.lastContactAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : null;
              return <tr key={a.id} className="border-b transition-colors hover:bg-soft">
                <td className="py-1.5 pr-3"><Button variant="link" onClick={() => onOpen(a.id)} className="h-auto max-w-full justify-start whitespace-normal p-0 py-1 text-left text-[13px] font-semibold">{a.name}</Button></td>
                <td className="pr-3 font-mono">{formatArr(a.arr, cur)}</td><td><span className="inline-flex items-center gap-2"><span aria-hidden className={cn("size-1.5 rounded-full", dot[a.level])}/>{levels[a.level]}</span></td>
                <td className="truncate pr-4 text-muted-ink" title={a.reason}>{a.reason}</td><td className="pr-2">{role === "Marta" ? <select aria-label={`Owner for ${a.name}`} value={a.owner} disabled={saving} onChange={(e) => onAssign(a.id, e.target.value)} className="h-8 w-full rounded border border-transparent bg-transparent px-1 text-[13px] hover:border-line focus:border-line disabled:opacity-50">{CSMS.map((c) => <option key={c} className="bg-panel">{c}</option>)}</select> : a.owner}</td>
                <td className="py-2 pr-2">{age === null ? <span className="text-muted-ink">Never contacted</span> : <><span className="font-mono">{age}d ago</span>{date && <span className="ml-2 font-mono text-muted-ink">{date}</span>}</>}</td>
                <td className="pr-1">{waiting.length ? stalled ? "Stalled · 5+ days" : "Awaiting reply" : messages.some((o) => o.status === "replied") ? "Replied" : a.status === "handled" ? "Handled" : "Not started"}</td>
                <td><Button variant="ghost" size="icon" aria-label={`Nudge ${a.owner} about ${a.name} in Slack`} title={a.owner === "Unassigned" ? "Assign an owner to nudge" : `Nudge ${a.owner} in Slack`} disabled={saving || a.owner === "Unassigned"} onClick={() => onNudge(a)} className="size-8 text-muted-ink"><Slack className="size-4" /></Button></td>
              </tr>;
            })}</tbody>
          </table>
          {rows.length === 0 && <div className="py-16 text-center text-muted-ink"><p>No accounts match these filters.</p>{filtered && <Button variant="link" onClick={reset} className="mt-2 font-normal">Clear filters</Button>}</div>}
        </div>
      )}
    </div>
  );
}
