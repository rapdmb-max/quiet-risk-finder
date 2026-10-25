import { formatArr, type Account } from "@/data/accounts";
import type { Outreach } from "@/data/outreach";
import type { Role } from "@/lib/brief";
import { useCurrency } from "@/lib/currency";
import { portfolioSummary, type Segment } from "@/lib/portfolio";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  list: Account[];
  outreach: Outreach[];
  role: Role;
  load: "loading" | "ready" | "error";
  activeSegment: Segment | null;
  onSummary: (segment: Segment) => void;
}

export function WorkspaceHeader({ title, list, outreach, role, load, activeSegment, onSummary }: Props) {
  const cur = useCurrency();
  const g = portfolioSummary(list, outreach);
  const summary = (id: Segment, label: string, value: string | number, note: string, risky = false) => (
    <Button key={label} variant="ghost" aria-pressed={activeSegment === id && id !== "all"} onClick={() => onSummary(id)}
      className={cn("h-auto min-h-24 min-w-0 flex-col items-start justify-start gap-1 whitespace-normal rounded-none border-b-2 px-0 py-3 text-left font-normal hover:bg-soft", activeSegment === id && id !== "all" ? "border-ink" : "border-transparent", risky && "text-risk")}>
      <span className="text-meta text-muted-ink">{label}</span>
      <span className="font-mono text-headline leading-tight">{load === "ready" ? value : "—"}</span>
      <span className="text-meta text-muted-ink">{load === "ready" ? note : load === "error" ? "Unavailable" : "Reading portfolio…"}</span>
    </Button>
  );
  return <div className="shell pt-5" data-testid="workspace-header">
    <div className="flex flex-wrap items-start justify-between gap-3 pb-4">
      <div><p className="eyebrow">{role === "Marta" ? "Team portfolio" : "Devon’s portfolio"} · Sample data</p><h1 className="headline mt-1">{title}</h1></div>
      <p className="font-mono text-meta text-muted-ink">{new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
    </div>
    <section aria-label="Portfolio totals" className="grid grid-cols-2 gap-x-5 border-t sm:grid-cols-4 2xl:grid-cols-8">
      {summary("all", "Accounts", g.count, `${g.count} in ${role === "Marta" ? "the team’s" : "your"} book`)}
      {summary("all", "Total ARR", formatArr(g.arr, cur), "Annual recurring revenue")}
      {summary("risk", "At-risk ARR", formatArr(g.riskArr, cur), `${g.riskCount} accounts · ${g.riskPercent.toFixed(1)}% of ARR`, true)}
      {summary("unassigned", "Unassigned at risk", g.unassignedCount, `${formatArr(g.unassignedArr, cur)} ARR`, g.unassignedCount > 0)}
      {summary("contacted", "Avg. contact age", g.averageContactAge === null ? "—" : `${g.averageContactAge.toFixed(1)}d`, `Across ${g.contactedCount} contacted accounts`)}
      {summary("overdue", "No contact · 30+ days", g.overdueCount, `${formatArr(g.overdueArr, cur)} ARR`)}
      {summary("never", "Never contacted", g.neverCount, `${formatArr(g.neverArr, cur)} ARR`)}
      {summary("waiting", "Awaiting replies", g.waitingCount, `${g.waitingAccounts} accounts · ${g.stalledCount} stalled`)}
    </section>
  </div>;
}