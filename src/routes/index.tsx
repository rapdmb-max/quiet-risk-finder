import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CSMS, CURRENCIES, formatArr, levelRank, type Account, type Currency } from "@/data/accounts";
import { filterAccounts, glance, isStalled, isUnderRadar, scopeFor, type Filter, type Role } from "@/lib/brief";
import { CurrencyProvider } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { LevelTag, Logo } from "@/components/undertow/Bits";
import { AccountDetail } from "@/components/undertow/AccountDetail";
import { Portfolio } from "@/components/undertow/Portfolio";
import { WorkspaceHeader } from "@/components/undertow/WorkspaceHeader";
import { Analytics } from "@/components/undertow/Analytics";
import { TeamLoad } from "@/components/undertow/TeamLoad";
import { Tracker, type Outreach } from "@/components/undertow/Tracker";
import type { ActivityItem, BriefState } from "@/lib/undertow.server";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MultiFilter } from "@/components/undertow/MultiFilter";
import { portfolioRows, type Segment, type Sort } from "@/lib/portfolio";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Undertow · Account portfolio" },
      { name: "description", content: "Undertow connects support, usage, CRM and Slack signals and tells your CS team which accounts need them this week." },
      { property: "og:title", content: "Undertow · Account portfolio" },
      { property: "og:description", content: "Your book of business: account risk, ARR, contact coverage and outstanding replies." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

type View = "brief" | "tracker" | "portfolio" | "analytics" | "team";
const VIEWS = [["portfolio", "Portfolio"], ["brief", "Triage"], ["tracker", "Outreach"], ["analytics", "Analytics"], ["team", "Team"]] as const;
const ROLES: [Role, string][] = [["Marta", "Head of CS"], ["Devon", "CSM"]];
const filtersFor = (role: Role): { id: Filter; label: string; key: string }[] =>
  role === "Marta"
    ? [{ id: "week", label: "Needs action", key: "1" }, { id: "radar", label: "No owner", key: "2" }, { id: "handled", label: "Handled", key: "3" }]
    : [{ id: "week", label: "My accounts", key: "1" }, { id: "handled", label: "Handled", key: "2" }];

function Index() {
  const [view, setView] = useState<View>("portfolio");
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [portfolioSegment, setPortfolioSegment] = useState<Segment>("all");
  const [summaryRevision, setSummaryRevision] = useState(0);
  const [ownerFocus, setOwnerFocus] = useState<{ owner: string; revision: number } | null>(null);
  const [role, setRole] = useState<Role>("Marta");
  const [list, setList] = useState<Account[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("week");
  const [triageOwners, setTriageOwners] = useState<string[]>([]);
  const [triageRisks, setTriageRisks] = useState<string[]>([]);
  const [triageSort, setTriageSort] = useState<Sort>("risk");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [toast, setToast] = useState<string | null>(null);
  const [palette, setPalette] = useState(false);
  const [emailConnected, setEmailConnected] = useState(false);
  const [outreach, setOutreach] = useState<Outreach[]>([]);
  const [query, setQuery] = useState("");
  const detailRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const say = (msg: string) => {
    setToast(msg);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3200);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  // Saved state lives in Lovable Cloud; the browser only holds a copy.
  const applyState = (s: BriefState) => { setList(s.accounts); setOutreach(s.outreach); setActivity(s.activity); };
  const refresh = async () => {
    try {
      const res = await fetch("/api/brief", { cache: "no-store" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message);
      applyState(body);
      setLoad("ready");
      return body as BriefState;
    } catch {
      setLoad("error");
      return null;
    }
  };
  useEffect(() => { void refresh(); }, []);

  /** Optimistic write: update the screen now, confirm with the server, roll back if it refuses. */
  const act = async (action: Record<string, unknown>, optimistic: () => void, ok: string) => {
    const before = { list, outreach };
    optimistic();
    setSaving(true);
    try {
      const res = await fetch("/api/brief", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ actor: role, ...action }) });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setList(before.list); setOutreach(before.outreach);
        if (res.status === 409) void refresh();
        say(body.message ?? "Couldn't save. Nothing changed. Try again.");
        return;
      }
      applyState(body);
      say(ok);
    } catch {
      setList(before.list); setOutreach(before.outreach);
      say("Couldn't save. Nothing changed. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const sorted = [...list].sort((a, b) => levelRank[a.level] - levelRank[b.level] || b.arr * (a.underRadar ? 1 : 0.5) - a.arr * (b.underRadar ? 1 : 0.5) || Number(b.underRadar) - Number(a.underRadar));
  const scoped = scopeFor(sorted, role);
  const FILTERS = filtersFor(role);
  const visible = portfolioRows(filterAccounts(scoped, filter), outreach, { segment: "all", query: "", owner: triageOwners, risk: triageRisks, sort: triageSort });
  const c = { week: filterAccounts(scoped, "week").length, radar: filterAccounts(scoped, "radar").length, handled: filterAccounts(scoped, "handled").length };
  const g = glance(list);
  const myOpen = filterAccounts(scoped, "week");
  const myStalled = outreach.filter((o) => isStalled(o) && (role === "Marta" || o.by === role)).length;
  const csms = CSMS.filter((x) => x !== "Unassigned");
  const selected = visible.find((a) => a.id === selectedId) ?? visible[0];
  const selectedActivity = selected ? activity.filter((x) => x.accountId === selected.id).slice(0, 5) : [];
  const open = filterAccounts(scoped, "week");
  const switchRole = (r: Role) => {
    setRole(r);
    setPortfolioId(null);
    setPortfolioSegment("all");
    setTriageOwners([]);
    setTriageRisks([]);
    setFilter("week");
    setSelectedId(filterAccounts(scopeFor(sorted, r), "week")[0]?.id ?? null);
    say(r === "Marta" ? "Viewing as Marta, Head of CS." : "Viewing as Devon, CSM. Only his accounts.");
  };

  const changeFilter = (f: Filter) => {
    setView("brief");
    setFilter(f);
    setSelectedId(filterAccounts(scoped, f)[0]?.id ?? null);
  };

  /** Every summary — header, analytics widget — opens that slice of the portfolio. */
  const openSegment = (segment: Segment) => {
    setPortfolioSegment(segment);
    setSummaryRevision((n) => n + 1);
    setOwnerFocus(null);
    setView("portfolio");
    window.scrollTo({ top: 0 });
  };


  const update = (id: string, patch: Partial<Account>) =>
    setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const assign = (id: string, owner: string) => {
    const a = list.find((x) => x.id === id);
    if (!a) return;
    void act({ type: "assign", accountId: id, owner },
      () => update(id, { owner, underRadar: isUnderRadar({ owner, lastTouchDays: a.lastTouchDays }) }),
      owner === "Unassigned" ? "Owner removed." : `Assigned to ${owner}. They'll get this summary in Slack.`);
  };

  const moveOn = (id: string, note: string) => {
    const idx = visible.findIndex((a) => a.id === id);
    const next = visible[idx + 1] ?? visible[idx - 1];
    update(id, { status: "handled", handledNote: note, underRadar: false });
    setSelectedId(next?.id ?? null);
  };
  const reachedOut = (id: string) => void act({ type: "reached_out", accountId: id }, () => moveOn(id, `${role} reached out · watching for 14 days`), "Marked as handled. Watching for 14 days.");
  const notRisk = (id: string) => void act({ type: "not_a_risk", accountId: id }, () => moveOn(id, "Marked not a real risk · signals weighted less"), "Got it. These signals will count less here.");
  const reopen = (id: string) => void act({ type: "reopen", accountId: id }, () => update(id, { status: "open", handledNote: undefined }), "Reopened. It's back in the brief.");
  const reset = () => void act({ type: "reset" }, () => {}, "Sample week restored.").then(() => { setFilter("week"); setSelectedId(null); });

  const openInBrief = (id?: string) => {
    setView("brief");
    setFilter("week");
    setSelectedId(id ?? open[0]?.id ?? null);
    window.scrollTo({ top: 0 });
  };

  // Keyboard navigation
  const stateRef = useRef({ visible, selected, view, palette, FILTERS });
  stateRef.current = { visible, selected, view, palette, FILTERS };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
        setQuery("");
        return;
      }
      const s = stateRef.current;
      if (s.palette) {
        if (e.key === "Escape") setPalette(false);
        return;
      }
      const t = e.target as HTMLElement;
      if (e.metaKey || e.ctrlKey || e.altKey || ["INPUT", "SELECT", "TEXTAREA"].includes(t.tagName)) return;
      const f = s.FILTERS.find((x) => x.key === e.key);
      if (f) return changeFilterRef.current(f.id);
      if (s.view !== "brief" || !s.visible.length) return;
      const idx = s.visible.findIndex((a) => a.id === s.selected?.id);
      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedId(s.visible[Math.min(idx + 1, s.visible.length - 1)]?.id ?? null);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedId(s.visible[Math.max(idx - 1, 0)]?.id ?? null);
      } else if (e.key === "e" && s.selected?.status === "open") actionsRef.current.reachedOut(s.selected.id);
      else if (e.key === "x" && s.selected?.status === "open") actionsRef.current.notRisk(s.selected.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const changeFilterRef = useRef(changeFilter);
  changeFilterRef.current = changeFilter;
  const actionsRef = useRef({ reachedOut, notRisk });
  actionsRef.current = { reachedOut, notRisk };

  const results = scoped.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  const portfolioAccount = scoped.find((a) => a.id === portfolioId);
  const detailFor = (a: Account) => (<AccountDetail
                        key={a.id}
                        account={a}
                        onAssign={(o) => assign(a.id, o)}
                        onReachedOut={() => reachedOut(a.id)}
                        onNotRisk={() => notRisk(a.id)}
                        onNotify={say}
                        emailConnected={emailConnected}
                        onConnectEmail={() => { setEmailConnected(true); say("Demo email connection enabled. Sending remains simulated."); }}
                        activity={activity.filter((x) => x.accountId === a.id).slice(0, 5)}
                        saving={saving}
                        onReopen={() => reopen(a.id)}
                        onSend={(channel, to, pdf) => void act({ type: "send", accountId: a.id, channel, to, pdf }, () => {
                          setOutreach((l) => [{ id: crypto.randomUUID(), accountId: a.id, account: a.name, channel, to, by: role, daysAgo: 0, pdf, status: "waiting" }, ...l]);
                          if (channel === "Email") moveOn(a.id, `${role} emailed ${to} · waiting on reply`);
                        }, `Simulated ${channel} message saved. Nothing was delivered.`)}
                      />);

  return (
    <CurrencyProvider value={currency}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b bg-bg/85 backdrop-blur-md">
          <div className="shell flex flex-wrap items-center gap-4 py-3">
            <div className="flex items-center gap-2 text-title font-semibold">
              <Logo /> Undertow
            </div>
            <div role="tablist" aria-label="View" className="relative grid rounded-lg border bg-panel p-1" style={{ gridTemplateColumns: `repeat(${VIEWS.length}, minmax(0, 1fr))` }}>
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 rounded-md bg-ink transition-transform duration-500 ease-spring"
                style={{ width: `calc((100% - 8px) / ${VIEWS.length})`, transform: `translateX(${VIEWS.findIndex(([v]) => v === view) * 100}%)` }}
              />
              {VIEWS.map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={view === id}
                  onClick={() => setView(id)}
                  className={cn("relative z-10 rounded-md px-3 py-1.5 text-meta transition-colors", view === id ? "text-ink-foreground" : "text-muted-ink hover:text-ink")}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3 text-meta text-muted-ink">
              <button onClick={() => { setPalette(true); setQuery(""); }} className="spring-press hidden items-center gap-2 rounded-md border bg-panel px-3 py-1.5 md:flex">
                Search accounts
              </button>
              <div role="radiogroup" aria-label="Currency" className="flex rounded-md border bg-panel p-0.5 font-mono text-meta">
                {(Object.keys(CURRENCIES) as Currency[]).map((cur) => (
                  <button
                    key={cur}
                    role="radio"
                    aria-checked={currency === cur}
                    onClick={() => setCurrency(cur)}
                    className={cn("rounded px-2 py-1", currency === cur ? "bg-ink text-ink-foreground" : "hover:text-ink")}
                  >
                    {CURRENCIES[cur].symbol}
                  </button>
                ))}
              </div>
              <div role="radiogroup" aria-label="Viewing as" className="flex rounded-md border bg-panel p-0.5 text-meta">
                {ROLES.map(([r, label]) => (
                  <button key={r} role="radio" aria-checked={role === r} onClick={() => switchRole(r)}
                    className={cn("rounded px-2.5 py-1", role === r ? "bg-ink font-semibold text-ink-foreground" : "hover:text-ink")}>
                    {r} · {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <WorkspaceHeader title={VIEWS.find(([id]) => id === view)?.[1] ?? "Portfolio"}
            list={scoped} outreach={outreach} role={role} load={load}
            activeSegment={view === "portfolio" ? portfolioSegment : null}
            onSummary={openSegment} />
        </header>

        <div className="shell py-6">
          <main className="min-w-0">
            {view === "portfolio" ? (
              <Portfolio key={role} list={scoped} outreach={outreach} role={role} segment={portfolioSegment} onSegmentChange={setPortfolioSegment} summaryRevision={summaryRevision} load={load} saving={saving} onAssign={assign}
                onNudge={(a) => void act({ type: "nudge", accountId: a.id }, () => {}, `Nudge to ${a.owner} saved in Slack activity.`)}
                onRetry={() => { setLoad("loading"); void refresh(); }} onOpen={setPortfolioId} ownerFocus={ownerFocus} />
            ) : view === "tracker" ? (
              <Tracker
                items={outreach}
                role={role}
                onReplied={(id) => void act({ type: "replied", outreachId: id }, () => setOutreach((l) => l.map((o) => (o.id === id ? { ...o, status: "replied" } : o))), "Marked as replied.")}
                onOpen={(id) => { const a = scoped.find((x) => x.id === id); if (a) pick(a); }}
                onEscalate={(o) => say(role === "Marta" ? `Draft opened: Marta to ${o.account}'s exec sponsor.` : `Marta asked to step in on ${o.account}.`)}
              />
            ) : view === "analytics" ? (
              <Analytics list={scoped} outreach={outreach} load={load} onRetry={() => { setLoad("loading"); void refresh(); }} onSummary={openSegment} />
            ) : view === "team" ? (
              <TeamLoad
                list={scoped}
                outreach={outreach}
                role={role}
                load={load}
                onRetry={() => { setLoad("loading"); void refresh(); }}
                onOpenOwner={(owner) => {
                  setPortfolioSegment("all");
                  setOwnerFocus({ owner, revision: (ownerFocus?.revision ?? 0) + 1 });
                  setView("portfolio");
                  window.scrollTo({ top: 0 });
                }}
              />
            ) : (
              <>
                <section className="flex flex-wrap items-end justify-between gap-6">
                  <div className="max-w-[780px]">
                    {load !== "ready" ? (
                      <h2 className="text-title font-semibold text-muted-ink">{load === "loading" ? "Reading this week's signals…" : "This week's brief didn't load."}</h2>
                    ) : role === "Marta" ? (
                      myStalled > 0 && (
                        <p className="mt-2 text-muted-ink">
                          <button onClick={() => setView("tracker")} className="font-semibold text-ink underline">{myStalled} reply stalled</button> waiting on a customer.
                        </p>
                      )
                    ) : (
                      <>
                        <h2 className="text-title font-semibold">
                          {myOpen.length === 0 ? "Nothing in your book needs you today." : `${myOpen.length} of your accounts need${myOpen.length === 1 ? "s" : ""} you today.`}
                        </h2>
                        <p className="mt-2 text-muted-ink">
                          <span className="font-mono">{formatArr(myOpen.reduce((t, a) => t + a.arr, 0), currency)}</span> a year in your hands.
                          {myStalled > 0 && <> <button onClick={() => setView("tracker")} className="font-semibold text-ink underline">{myStalled} customer gone quiet</button> after your last message.</>}
                        </p>
                      </>
                    )}
                  </div>
                  <div role="tablist" aria-label="Queue" className="inline-flex flex-wrap rounded-lg border bg-panel p-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        role="tab"
                        aria-selected={filter === f.id}
                        onClick={() => changeFilter(f.id)}
                        className={cn(
                          "spring-press rounded-md px-4 py-1.5 text-meta",
                          filter === f.id ? "bg-ink text-ink-foreground" : "text-muted-ink hover:text-ink",
                        )}
                      >
                        {f.label} <span className="ml-1.5 font-mono text-meta opacity-70">{c[f.id]}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {role === "Marta" && <MultiFilter label="Owner" values={triageOwners} onChange={setTriageOwners} options={CSMS.map((c) => ({ value: c, label: c }))}/>}
                  <MultiFilter label="Risk" values={triageRisks} onChange={setTriageRisks} options={[{ value: "high", label: "High" }, { value: "rising", label: "Rising" }, { value: "calm", label: "Healthy" }]}/>
                  <label className="flex items-center gap-2 text-meta text-muted-ink">Sort<select aria-label="Sort triage" value={triageSort} onChange={(e) => setTriageSort(e.target.value as Sort)} className="h-9 rounded-md border bg-panel px-2 text-ink"><option value="risk">Risk first</option><option value="arr-desc">ARR · highest first</option><option value="arr-asc">ARR · lowest first</option><option value="contact-oldest">Contact · oldest first</option><option value="contact-newest">Contact · newest first</option><option value="name-asc">Account · A–Z</option><option value="name-desc">Account · Z–A</option></select></label>
                  {(triageOwners.length > 0 || triageRisks.length > 0) && <Button variant="ghost" className="text-meta font-normal" onClick={() => { setTriageOwners([]); setTriageRisks([]); }}>Clear filters</Button>}
                  <span className="font-mono text-meta text-muted-ink">{visible.length} accounts</span>
                </div>
                <div className="mt-6 grid gap-6 min-[900px]:grid-cols-12">
                  {/* Pane 2: list, one line per account like the Slack brief */}
                  <div className="self-start overflow-hidden rounded-lg border bg-panel min-[900px]:col-span-5">
                    {load === "loading" && [0, 1, 2, 3].map((i) => (
                      <div key={i} aria-hidden className="border-b px-4 py-4 last:border-b-0">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-soft" />
                        <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-soft" />
                      </div>
                    ))}
                    {load === "error" && (
                      <div className="p-8 text-center text-muted-ink">
                        <p>Couldn't load this week's brief.</p>
                        <button onClick={() => { setLoad("loading"); void refresh(); }} className="spring-press mt-3 rounded-md border px-3 py-1.5 text-ink hover:bg-soft">Try again</button>
                      </div>
                    )}
                    {load === "ready" && visible.length === 0 && <p className="p-8 text-center text-muted-ink">Nothing here.</p>}
                    {visible.map((a, i) => {
                      const lvl = a.status === "handled" ? "calm" : a.level;
                      return (
                        <div key={a.id} className="border-b last:border-b-0">
                        <button
                          aria-current={selected?.id === a.id ? "true" : undefined}
                          onClick={() => {
                            setSelectedId(a.id);
                            if (window.matchMedia("(max-width: 899px)").matches)
                              requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                          }}
                          className={cn(
                            "flex w-full gap-3 border-l-[3px] px-4 py-3 text-left transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink",
                            selected?.id === a.id ? "border-l-ink bg-soft" : "border-l-transparent",
                          )}
                        >
                          <span className="w-5 pt-px font-mono text-meta text-muted-ink">{i + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span aria-label={lvl} className={cn("size-2 shrink-0 self-center rounded-full", dot[lvl])} />
                              <span className="truncate font-semibold">{a.name}</span>
                              <span className="ml-auto shrink-0 font-mono text-meta text-muted-ink">{formatArr(a.arr, currency)}</span>
                            </span>
                            <span className="mt-0.5 block truncate text-meta text-muted-ink">
                              {a.status === "handled" ? a.handledNote : a.reason}
                            </span>
                            <span className="mt-1 block text-meta">
                              {a.underRadar && a.status === "open" ? (
                                <span className="font-semibold">No owner · under the radar</span>
                              ) : (
                                <span className="text-muted-ink">{a.owner === "Unassigned" ? "No owner" : a.owner}</span>
                              )}
                            </span>
                          </span>
                        </button>
                        {role === "Marta" && a.status === "open" && a.owner === "Unassigned" && (
                          <div className="flex items-center gap-2 px-4 pb-3 pl-12">
                            <select aria-label={`Assign ${a.name}`} defaultValue="" onChange={(e) => assign(a.id, e.target.value)}
                              className="rounded-md border bg-panel px-2 py-1 text-meta">
                              <option value="" disabled>Assign to…</option>
                              {csms.map((x) => <option key={x} value={x}>{x} ({g.workload[x] ?? 0} open)</option>)}
                            </select>
                          </div>
                        )}
                        </div>
                      );
                    })}
                  </div>
                  {/* Pane 3: detail */}
                  <div ref={detailRef} className="scroll-mt-20 min-[900px]:col-span-7">
                    {selected ? (
                      detailFor(selected)
                    ) : load === "ready" ? (
                      <div className="rounded-lg border bg-panel p-10 text-center text-muted-ink">Nothing here.</div>
                    ) : (
                      <div aria-busy className="h-[420px] animate-pulse rounded-lg border bg-panel" />
                    )}
                  </div>
                </div>
              </>
            )}
            <p className="mt-12 text-center text-meta text-muted-ink">
              Sample companies and people are fictional; actions are saved. Email, Slack and PDF sending are simulated. Currency rates are illustrative.

            </p>
          </main>
        </div>

        <Dialog open={Boolean(portfolioAccount) && view === "portfolio"} onOpenChange={(open) => { if (!open) setPortfolioId(null); }}>
          <DialogContent aria-describedby={undefined} className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-[1040px] overflow-y-auto p-0">
            <DialogTitle className="sr-only">{portfolioAccount?.name ?? "Account detail"}</DialogTitle>
            {portfolioAccount && detailFor(portfolioAccount)}
          </DialogContent>
        </Dialog>

        {/* Dynamic Island */}
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-4">
          <div
            className={cn(
              "island toast-shadow overflow-hidden whitespace-nowrap bg-ink text-meta text-ink-foreground",
              toast ? "max-w-[92vw] rounded-2xl px-5 py-3 opacity-100" : "w-0 rounded-full px-0 py-3 opacity-0",
            )}
          >
            {toast && (
              <span className="pane-enter flex items-center gap-2">
                <span className="size-2 rounded-full bg-calm" /> {toast}
              </span>
            )}
          </div>
        </div>

        {/* Command palette */}
        {palette && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-ink/30 px-4 pt-[15vh] backdrop-blur-sm" onClick={() => setPalette(false)}>
            <div role="dialog" aria-label="Search accounts" className="pane-enter w-full max-w-[560px] overflow-hidden rounded-xl border bg-panel toast-shadow" onClick={(e) => e.stopPropagation()}>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) pick(results[0]);
                  if (e.key === "Escape") setPalette(false);
                }}
                placeholder="Jump to an account…"
                className="w-full border-b bg-transparent px-5 py-4 text-body outline-none placeholder:text-muted-ink"
              />
              <ul className="max-h-[320px] overflow-auto p-2">
                {results.length === 0 && <li className="p-4 text-muted-ink">No account by that name.</li>}
                {results.map((a) => (
                  <li key={a.id}>
                    <button onClick={() => pick(a)} className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left hover:bg-soft">
                      <span className="font-semibold">{a.name}</span>
                      <LevelTag level={a.status === "handled" ? "calm" : a.level} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </CurrencyProvider>
  );

  function pick(a: Account) {
    if (view === "portfolio") { setPortfolioId(a.id); setPalette(false); return; }
    setView("brief");
    setFilter(a.status === "handled" ? "handled" : "week");
    setSelectedId(a.id);
    setPalette(false);
  }
}

const dot = { high: "bg-risk", rising: "bg-rising", calm: "bg-calm" } as const;

