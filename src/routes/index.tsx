import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ACCOUNTS_WATCHED, BRIEF_DATE, CSMS, CURRENCIES, LAST_WEEK, formatArr, levelRank, type Account, type Currency } from "@/data/accounts";
import { filterAccounts, glance, isStalled, isUnderRadar, scopeFor, type Filter, type Role } from "@/lib/brief";
import { CurrencyProvider } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { LevelTag, Logo, Tag } from "@/components/undertow/Bits";
import { AccountDetail } from "@/components/undertow/AccountDetail";
import { Portfolio } from "@/components/undertow/Portfolio";
import { Tracker, type Outreach } from "@/components/undertow/Tracker";
import type { ActivityItem, BriefState } from "@/lib/undertow.server";

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

type View = "brief" | "tracker" | "portfolio";
const VIEWS = [["brief", "Triage"], ["tracker", "Outreach"], ["portfolio", "Portfolio"]] as const;
const ROLES: [Role, string][] = [["Marta", "Head of CS"], ["Devon", "CSM"]];
const filtersFor = (role: Role): { id: Filter; label: string; key: string }[] =>
  role === "Marta"
    ? [{ id: "week", label: "Needs action", key: "1" }, { id: "radar", label: "No owner", key: "2" }, { id: "handled", label: "Handled", key: "3" }]
    : [{ id: "week", label: "My accounts", key: "1" }, { id: "handled", label: "Handled", key: "2" }];

function Index() {
  const [view, setView] = useState<View>("brief");
  const [role, setRole] = useState<Role>("Marta");
  const [list, setList] = useState<Account[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [load, setLoad] = useState<"loading" | "ready" | "error">("loading");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<Filter>("week");
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
  const visible = filterAccounts(scoped, filter);
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
    setFilter("week");
    setSelectedId(filterAccounts(scopeFor(sorted, r), "week")[0]?.id ?? null);
    say(r === "Marta" ? "Viewing as Marta, Head of CS." : "Viewing as Devon, CSM. Only his accounts.");
  };

  const changeFilter = (f: Filter) => {
    setView("brief");
    setFilter(f);
    setSelectedId(filterAccounts(scoped, f)[0]?.id ?? null);
  };

  const update = (id: string, patch: Partial<Account>) =>
    setList((l) => l.map((a) => (a.id === id ? { ...a, ...patch } : a)));

  const assign = (id: string, owner: string) => {
    const a = list.find((x) => x.id === id)!;
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
        setSelectedId(s.visible[Math.min(idx + 1, s.visible.length - 1)]!.id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedId(s.visible[Math.max(idx - 1, 0)]!.id);
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

  const results = sorted.filter((a) => a.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <CurrencyProvider value={currency}>
      <div className="min-h-screen">
        <header className="sticky top-0 z-20 border-b bg-bg/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-5 py-3 sm:px-8">
            <div className="flex items-center gap-2 text-[17px] font-semibold">
              <Logo /> Undertow
            </div>
            <div role="tablist" aria-label="View" className="relative grid grid-cols-3 rounded-lg border bg-panel p-1">
              <span
                aria-hidden
                className="absolute inset-y-1 left-1 w-[calc(33.333%-2.67px)] rounded-md bg-ink transition-transform duration-500 ease-spring"
                style={{ transform: `translateX(${VIEWS.findIndex(([v]) => v === view) * 100}%)` }}
              />
              {VIEWS.map(([id, label]) => (
                <button
                  key={id}
                  role="tab"
                  aria-selected={view === id}
                  onClick={() => setView(id)}
                  className={cn("relative z-10 rounded-md px-3 py-1.5 text-[13px] transition-colors", view === id ? "text-ink-foreground" : "text-muted-ink hover:text-ink")}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex items-center gap-3 text-[13px] text-muted-ink">
              <button onClick={() => { setPalette(true); setQuery(""); }} className="spring-press hidden items-center gap-2 rounded-md border bg-panel px-3 py-1.5 md:flex">
                Search accounts <kbd className="kbd">⌘K</kbd>
              </button>
              <div role="radiogroup" aria-label="Currency" className="flex rounded-md border bg-panel p-0.5 font-mono text-[13px]">
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
              <div role="radiogroup" aria-label="Viewing as" className="flex rounded-md border bg-panel p-0.5 text-[13px]">
                {ROLES.map(([r, label]) => (
                  <button key={r} role="radio" aria-checked={role === r} onClick={() => switchRole(r)}
                    className={cn("rounded px-2.5 py-1", role === r ? "bg-ink font-semibold text-ink-foreground" : "hover:text-ink")}>
                    {r} · {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-10 sm:px-8 min-[1180px]:grid-cols-[200px_1fr]">
          {/* Pane 1: sidebar */}
          <aside className="hidden min-[1180px]:block">
            <nav className="sticky top-24 space-y-1" aria-label="Filters">
              <p className="eyebrow mb-3 px-3">{role === "Marta" ? "Team queue" : "My queue"}</p>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => changeFilter(f.id)}
                  aria-pressed={view === "brief" && filter === f.id}
                  className={cn(
                    "spring-press flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-[15px]",
                    view === "brief" && filter === f.id ? "bg-ink font-semibold text-ink-foreground" : "text-muted-ink hover:bg-soft hover:text-ink",
                  )}
                >
                  {f.label}
                  <span className="font-mono text-[13px] opacity-70">{c[f.id]}</span>
                </button>
              ))}
              <div className="mt-8 space-y-2 border-t px-3 pt-5 text-[13px] text-muted-ink">
                <p className="eyebrow mb-2">Shortcuts</p>
                {[["J / K", "Move"], ["E", "Reached out"], ["X", "Not a risk"], [role === "Marta" ? "1–3" : "1–2", "Filters"], ["⌘K", "Search"]].map(([k, l]) => (
                  <p key={k} className="flex justify-between"><span>{l}</span><span className="font-mono">{k}</span></p>
                ))}
              </div>
            </nav>
          </aside>

          <main className="min-w-0">
            {view === "portfolio" ? (
              <Portfolio list={sorted} onOpen={(id) => pick(list.find((x) => x.id === id)!)} />
            ) : view === "tracker" ? (
              <Tracker
                items={outreach}
                role={role}
                onReplied={(id) => void act({ type: "replied", outreachId: id }, () => setOutreach((l) => l.map((o) => (o.id === id ? { ...o, status: "replied" } : o))), "Marked as replied.")}
                onOpen={(id) => pick(list.find((x) => x.id === id)!)}
                onEscalate={(o) => say(role === "Marta" ? `Draft opened: Marta to ${o.account}'s exec sponsor.` : `Marta asked to step in on ${o.account}.`)}
              />
            ) : (
              <>
                <section className="flex flex-wrap items-end justify-between gap-6">
                  <div className="max-w-[780px]">
                    <p className="font-mono text-[13px] text-muted-ink">
                      {BRIEF_DATE} · {ACCOUNTS_WATCHED} accounts watched
                    </p>
                    {load !== "ready" ? (
                      <h1 className="headline mt-2 text-muted-ink">{load === "loading" ? "Reading this week's signals…" : "This week's brief didn't load."}</h1>
                    ) : role === "Marta" ? (
                      <>
                        <h1 className="headline mt-2">
                          <span className="font-mono">{formatArr(g.arrAtRisk, currency)}</span> a year at risk across {g.open} account{g.open === 1 ? "" : "s"}.{" "}
                          {g.unowned.length > 0 && <span className="text-risk">{g.unowned.length} {g.unowned.length === 1 ? "has" : "have"} no owner.</span>}
                        </h1>
                        <p className="mt-2 text-muted-ink">
                          Last week: <span className="font-mono">{LAST_WEEK.open}</span> accounts, <span className="font-mono">{formatArr(LAST_WEEK.arrAtRisk, currency)}</span>.
                          {" "}Team load: {csms.map((x) => `${x} ${g.workload[x] ?? 0}`).join(" · ")}.
                          {myStalled > 0 && <> <button onClick={() => setView("tracker")} className="font-semibold text-ink underline">{myStalled} reply stalled</button>.</>}
                        </p>
                      </>
                    ) : (
                      <>
                        <h1 className="headline mt-2">
                          {myOpen.length === 0 ? "Nothing in your book needs you today." : `${myOpen.length} of your accounts need${myOpen.length === 1 ? "s" : ""} you today.`}
                        </h1>
                        <p className="mt-2 text-muted-ink">
                          <span className="font-mono">{formatArr(myOpen.reduce((t, a) => t + a.arr, 0), currency)}</span> a year in your hands.
                          {myStalled > 0 && <> <button onClick={() => setView("tracker")} className="font-semibold text-ink underline">{myStalled} customer gone quiet</button> after your last message.</>}
                        </p>
                      </>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 min-[1180px]:hidden">
                    {FILTERS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => changeFilter(f.id)}
                        aria-pressed={filter === f.id}
                        className={cn("spring-press rounded-full border px-4 py-1.5", filter === f.id ? "border-ink bg-ink font-semibold text-ink-foreground" : "bg-panel hover:bg-soft")}
                      >
                        {f.label} <span className="ml-1 font-mono text-[13px] opacity-70">{c[f.id]}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <div className="mt-6 grid gap-6 min-[900px]:grid-cols-12">
                  {/* Pane 2: list, one line per account like the Slack brief */}
                  <div className="self-start overflow-hidden rounded-lg border bg-panel min-[900px]:sticky min-[900px]:top-24 min-[900px]:col-span-5">
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
                          <span className="w-5 pt-px font-mono text-[13px] text-muted-ink">{i + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-baseline gap-2">
                              <span aria-label={lvl} className={cn("size-2 shrink-0 self-center rounded-full", dot[lvl])} />
                              <span className="truncate font-semibold">{a.name}</span>
                              <span className="ml-auto shrink-0 font-mono text-[13px] text-muted-ink">{formatArr(a.arr, currency)}</span>
                            </span>
                            <span className="mt-0.5 block truncate text-[13px] text-muted-ink">
                              {a.status === "handled" ? a.handledNote : a.reason}
                            </span>
                            <span className="mt-1 block text-[13px]">
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
                              className="rounded-md border bg-panel px-2 py-1 text-[13px]">
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
                      <AccountDetail
                        key={selected.id}
                        account={selected}
                        onAssign={(o) => assign(selected.id, o)}
                        onReachedOut={() => reachedOut(selected.id)}
                        onNotRisk={() => notRisk(selected.id)}
                        onNotify={say}
                        emailConnected={emailConnected}
                        onConnectEmail={() => { setEmailConnected(true); say(`Email connected as ${role.toLowerCase()}@yourcompany.com.`); }}
                        activity={selectedActivity}
                        saving={saving}
                        onReopen={() => reopen(selected.id)}
                        onSend={(channel, to, pdf) => void act({ type: "send", accountId: selected.id, channel, to, pdf }, () => {
                          setOutreach((l) => [{ id: crypto.randomUUID(), accountId: selected.id, account: selected.name, channel, to, by: role, daysAgo: 0, pdf, status: "waiting" }, ...l]);
                          if (channel === "Email") moveOn(selected.id, `${role} emailed ${to} · waiting on reply`);
                        }, channel === "Email" ? `Email sent to ${to}${pdf ? " with PDF" : ""}. Tracking the reply.` : `Sent to ${to} in Slack. Tracking the reply.`)}
                      />
                    ) : load === "ready" ? (
                      <div className="rounded-lg border bg-panel p-10 text-center text-muted-ink">Nothing here.</div>
                    ) : (
                      <div aria-busy className="h-[420px] animate-pulse rounded-lg border bg-panel" />
                    )}
                  </div>
                </div>
              </>
            )}
            <p className="mt-12 text-center text-[13px] text-muted-ink">
              Sample companies and people are fictional; actions are saved. Currency rates are illustrative.
              {role === "Marta" && load === "ready" && <> · <button onClick={reset} className="underline hover:text-ink">Reset sample week</button></>}
            </p>
          </main>
        </div>

        {/* Dynamic Island */}
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 top-3 z-40 flex justify-center px-4">
          <div
            className={cn(
              "island toast-shadow overflow-hidden whitespace-nowrap bg-ink text-[13px] text-ink-foreground",
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
                className="w-full border-b bg-transparent px-5 py-4 text-[15px] outline-none placeholder:text-muted-ink"
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
    setView("brief");
    setFilter(a.status === "handled" ? "handled" : "week");
    setSelectedId(a.id);
    setPalette(false);
  }
}

const dot = { high: "bg-risk", rising: "bg-rising", calm: "bg-calm" } as const;

