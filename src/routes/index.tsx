import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ACCOUNTS_WATCHED, BRIEF_DATE, accounts as seed, formatArr, levelRank, type Account } from "@/data/accounts";
import { counts, filterAccounts, headline, isUnderRadar, type Filter } from "@/lib/brief";
import { cn } from "@/lib/utils";
import { LevelTag, Logo, Tag } from "@/components/undertow/Bits";
import { AccountDetail } from "@/components/undertow/AccountDetail";
import { SlackPreview } from "@/components/undertow/SlackPreview";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Undertow · Your weekly account brief" },
      { name: "description", content: "Undertow connects support, usage, CRM and Slack signals and tells your CS team which accounts need them this week." },
      { property: "og:title", content: "Undertow · Your weekly account brief" },
      { property: "og:description", content: "Which accounts need you this week, and why. Pushed to Slack every Monday." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type View = "brief" | "slack";
const FILTERS: { id: Filter; label: string }[] = [
  { id: "week", label: "This week" },
  { id: "radar", label: "Under the radar" },
  { id: "handled", label: "Handled" },
];

function Index() {
  const [view, setView] = useState<View>("brief");
  const [list, setList] = useState<Account[]>(seed);
  const [filter, setFilter] = useState<Filter>("week");
  const [selectedId, setSelectedId] = useState<string | null>(seed[0]?.id ?? null);
  const [toast, setToast] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = (msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3000);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const sorted = [...list].sort((a, b) => levelRank[a.level] - levelRank[b.level] || b.arr * (a.underRadar ? 1 : 0.5) - a.arr * (b.underRadar ? 1 : 0.5) || Number(b.underRadar) - Number(a.underRadar));
  const visible = filterAccounts(sorted, filter);
  const c = counts(list);
  const h = headline(list);
  const selected = visible.find((a) => a.id === selectedId) ?? visible[0];
  const open = filterAccounts(sorted, "week");

  const changeFilter = (f: Filter) => {
    setFilter(f);
    setSelectedId(filterAccounts(sorted, f)[0]?.id ?? null);
  };

  const update = (id: string, patch: Partial<Account>) =>
    setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const assign = (id: string, owner: string) => {
    const a = list.find((x) => x.id === id)!;
    update(id, { owner, underRadar: isUnderRadar({ owner, lastTouchDays: a.lastTouchDays }) });
    say(owner === "Unassigned" ? "Owner removed." : `Assigned to ${owner}. They'll get a Slack message with this summary.`);
  };

  const handle = (id: string, note: string, msg: string) => {
    const idx = visible.findIndex((a) => a.id === id);
    const next = visible[idx + 1] ?? visible[idx - 1];
    update(id, { status: "handled", handledNote: note, underRadar: false });
    setSelectedId(next?.id ?? null);
    say(msg);
  };

  const openInBrief = (id?: string) => {
    setView("brief");
    setFilter("week");
    setSelectedId(id ?? open[0]?.id ?? null);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-4 px-5 py-3 sm:px-8">
          <div className="flex items-center gap-2 text-[20px] font-bold tracking-tight">
            <Logo /> Undertow
          </div>
          <div role="tablist" aria-label="View" className="flex rounded-lg border bg-panel p-1">
            {([["brief", "Weekly brief"], ["slack", "How it reaches Marta"]] as const).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={cn("rounded-md px-3 py-1.5 text-[14px] font-medium transition-colors", view === id ? "bg-ink text-ink-foreground" : "text-muted-ink hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-3 text-[14px] text-muted-ink">
            <span className="hidden sm:inline">Northpeak · CS team</span>
            <span className="grid size-8 place-items-center rounded-full bg-ink text-[13px] font-semibold text-ink-foreground">M</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
        {view === "slack" ? (
          <SlackPreview
            open={open}
            onOpenBrief={() => openInBrief()}
            onSeeWhy={(id) => openInBrief(id)}
            onAssign={assign}
            onRemind={() => say("Okay. Undertow will post this again tomorrow at 08:30.")}
          />
        ) : (
          <>
            <section className="flex flex-wrap items-end justify-between gap-6">
              <div className="max-w-[720px]">
                <p className="font-mono text-[13px] uppercase tracking-wider text-muted-ink">
                  {BRIEF_DATE} · {ACCOUNTS_WATCHED} accounts watched
                </p>
                <h1 className="headline mt-3">
                  {h.lead} {h.tail && <span className="text-risk">{h.tail}</span>}
                </h1>
                <p className="mt-3 text-[16px] text-muted-ink">
                  Undertow connects support tickets, product usage, CRM and Slack, and tells you where to look. It never contacts a customer for you.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => changeFilter(f.id)}
                    aria-pressed={filter === f.id}
                    className={cn("rounded-full border px-4 py-2 text-[15px] font-medium", filter === f.id ? "border-ink bg-ink text-ink-foreground" : "bg-panel hover:bg-soft")}
                  >
                    {f.label} <span className="ml-1 font-mono text-[12px] opacity-70">{c[f.id]}</span>
                  </button>
                ))}
              </div>
            </section>

            <div className="mt-8 grid gap-6 min-[900px]:grid-cols-12">
              <div className="self-start overflow-hidden rounded-lg border bg-panel min-[900px]:col-span-5">
                {visible.length === 0 && <p className="p-8 text-center text-muted-ink">Nothing here.</p>}
                {visible.map((a, i) => (
                  <button
                    key={a.id}
                    aria-current={selected?.id === a.id ? "true" : undefined}
                    onClick={() => {
                      setSelectedId(a.id);
                      if (window.matchMedia("(max-width: 899px)").matches)
                        requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                    }}
                    className={cn(
                      "flex w-full gap-4 border-b focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink border-l-[3px] px-5 py-5 text-left last:border-b-0 hover:bg-soft",
                      selected?.id === a.id ? "border-l-ink bg-soft" : "border-l-transparent",
                    )}
                  >
                    <span className="pt-0.5 font-mono text-[13px] text-muted-ink">{String(i + 1).padStart(2, "0")}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="text-[16px] font-semibold">{a.name}</span>
                        <span className="font-mono text-[13px] text-muted-ink">{formatArr(a.arr)}/yr</span>
                      </span>
                      <span className="mt-1 block text-muted-ink">{a.status === "handled" ? a.handledNote : a.reason}</span>
                      <span className="mt-3 flex flex-wrap gap-2">
                        <LevelTag level={a.status === "handled" ? "calm" : a.level} />
                        {a.underRadar && a.status === "open" && <Tag solid>Under the radar</Tag>}
                        <Tag>{a.owner === "Unassigned" ? "No owner" : a.owner}</Tag>
                      </span>
                    </span>
                  </button>
                ))}
              </div>
              <div ref={detailRef} className="scroll-mt-4 min-[900px]:col-span-7">
                {selected ? (
                  <AccountDetail
                    key={selected.id}
                    account={selected}
                    onAssign={(o) => assign(selected.id, o)}
                    onReachedOut={() => handle(selected.id, "Marta reached out · watching for 14 days", "Marked as handled. Undertow will tell you if the signals don't improve in 14 days.")}
                    onNotRisk={() => handle(selected.id, "Marked not a real risk · signals weighted less", "Got it. Undertow will weigh these signals less for this account.")}
                  />
                ) : (
                  <div className="rounded-lg border bg-panel p-10 text-center text-muted-ink">Nothing here.</div>
                )}
              </div>
            </div>
          </>
        )}
        <p className="mt-12 text-center text-[13px] text-muted-ink">
          Clickable prototype with sample data. Companies and people are fictional.
        </p>
      </main>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 flex justify-center px-4">
        {toast && (
          <div className="toast-shadow animate-in fade-in slide-in-from-bottom-2 rounded-lg bg-ink px-5 py-3 text-[14px] font-medium text-ink-foreground">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
