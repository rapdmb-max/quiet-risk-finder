import { accounts as SAMPLE, type Account, type Signal, type TimelineEvent } from "@/data/accounts";
import { SEED_OUTREACH, type Outreach } from "@/data/outreach";
import type { Database } from "@/integrations/supabase/types";
import { actionSchema, decide, withDerived, type Action } from "./rules";

type AccountRow = Database["public"]["Tables"]["accounts"]["Row"];
type OutreachRow = Database["public"]["Tables"]["outreach"]["Row"];
type EventRow = Database["public"]["Tables"]["account_events"]["Row"];

export interface ActivityItem { id: string; accountId: string; actor: string; type: string; detail: string; at: string }
export interface BriefState { accounts: Account[]; outreach: Outreach[]; activity: ActivityItem[] }

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

const DAY = 86_400_000;
const db = async () => (await import("@/integrations/supabase/client.server")).supabaseAdmin;
const fail = (what: string, error: unknown) => {
  console.error(`[undertow] ${what}`, error);
  return new HttpError(503, "Undertow couldn't reach its database. Nothing was changed. Try again in a moment.");
};

export function toAccount(r: AccountRow): Account {
  return withDerived({
    id: r.id, name: r.name, arr: r.arr_eur, level: r.level as Account["level"], owner: r.owner,
    lastTouchDays: r.last_touch_days, reason: r.reason, verdict: r.verdict,
    signals: (r.signals ?? []) as unknown as Signal[], timeline: (r.timeline ?? []) as unknown as TimelineEvent[],
    suggestion: r.suggestion, status: r.status as Account["status"], handledNote: r.handled_note ?? undefined,
  });
}

function toOutreach(r: OutreachRow, names: Map<string, string>): Outreach {
  return {
    id: r.id, accountId: r.account_id, account: names.get(r.account_id) ?? r.account_id,
    channel: r.channel as Outreach["channel"], to: r.recipient, by: r.sent_by, pdf: r.pdf,
    status: r.status as Outreach["status"], daysAgo: Math.max(0, Math.floor((Date.now() - Date.parse(r.sent_at)) / DAY)),
  };
}

const toActivity = (r: EventRow): ActivityItem => ({ id: r.id, accountId: r.account_id, actor: r.actor, type: r.type, detail: r.detail, at: r.created_at });

/** Replace everything with the sample week. Used on first run and by "Reset sample data". */
async function seed() {
  const sb = await db();
  const { error: wipe } = await sb.from("accounts").delete().neq("id", "");
  if (wipe) throw fail("wipe", wipe);
  const { error: insertAccounts } = await sb.from("accounts").insert(SAMPLE.map((a) => ({
    id: a.id, name: a.name, arr_eur: a.arr, level: a.level, owner: a.owner, last_touch_days: a.lastTouchDays,
    reason: a.reason, verdict: a.verdict, signals: a.signals as never, timeline: a.timeline as never, suggestion: a.suggestion,
    status: a.status, handled_reason: a.status === "handled" ? "seed" : null, handled_note: a.handledNote ?? null,
    handled_at: a.status === "handled" ? new Date().toISOString() : null,
  })));
  if (insertAccounts) throw fail("seed accounts", insertAccounts);
  const { error: insertOutreach } = await sb.from("outreach").insert(SEED_OUTREACH.map((o) => ({
    account_id: o.accountId, channel: o.channel, recipient: o.to, sent_by: o.by, pdf: o.pdf, status: o.status,
    sent_at: new Date(Date.now() - o.daysAgo * DAY).toISOString(),
  })));
  if (insertOutreach) throw fail("seed outreach", insertOutreach);
}

export async function loadState(): Promise<BriefState> {
  const sb = await db();
  let { data: rows, error } = await sb.from("accounts").select("*");
  if (error) throw fail("load accounts", error);
  if (!rows?.length) {
    await seed();
    ({ data: rows, error } = await sb.from("accounts").select("*"));
    if (error) throw fail("reload accounts", error);
  }
  const [{ data: out, error: outError }, { data: events, error: eventError }] = await Promise.all([
    sb.from("outreach").select("*").order("sent_at", { ascending: false }),
    sb.from("account_events").select("*").order("created_at", { ascending: false }).limit(100),
  ]);
  if (outError) throw fail("load outreach", outError);
  if (eventError) throw fail("load activity", eventError);
  const list = (rows ?? []).map(toAccount);
  const names = new Map(list.map((a) => [a.id, a.name]));
  return { accounts: list, outreach: (out ?? []).map((o) => toOutreach(o, names)), activity: (events ?? []).map(toActivity) };
}

export async function getAccount(id: string): Promise<Account | null> {
  const sb = await db();
  const { data, error } = await sb.from("accounts").select("*").eq("id", id).maybeSingle();
  if (error) throw fail("get account", error);
  return data ? toAccount(data) : null;
}

async function logEvent(accountId: string, actor: string, type: string, detail: string) {
  const sb = await db();
  const { error } = await sb.from("account_events").insert({ account_id: accountId, actor, type, detail });
  if (error) throw fail("log event", error);
}

export async function applyAction(input: unknown): Promise<BriefState> {
  const parsed = actionSchema.safeParse(input);
  if (!parsed.success) throw new HttpError(400, "That action isn't valid.");
  const action: Action = parsed.data;
  const sb = await db();

  if (action.type === "reset") {
    if (action.actor !== "Marta") throw new HttpError(403, "Only the Head of CS can reset the sample week.");
    await seed();
    return loadState();
  }

  if (action.type === "replied") {
    const { data, error } = await sb.from("outreach").update({ status: "replied" }).eq("id", action.outreachId).eq("status", "waiting").select("account_id").maybeSingle();
    if (error) throw fail("mark replied", error);
    if (!data) throw new HttpError(409, "That message is already marked as replied.");
    await logEvent(data.account_id, action.actor, "replied", "customer replied");
    return loadState();
  }

  const account = await getAccount(action.accountId);
  if (!account) throw new HttpError(404, "That account no longer exists.");
  const decision = decide(account, action);
  if (!decision.ok) throw new HttpError(decision.status, decision.message);

  if (decision.patch) {
    const handledAt = decision.patch.status === "handled" ? new Date().toISOString() : decision.patch.status === "open" ? null : undefined;
    // Guard on the status we decided from, so two people acting at once can't both win.
    const { data, error } = await sb.from("accounts")
      .update({ ...decision.patch, ...(handledAt !== undefined && { handled_at: handledAt }), updated_at: new Date().toISOString() })
      .eq("id", account.id).eq("status", account.status).eq("owner", account.owner)
      .select("id").maybeSingle();
    if (error) throw fail("update account", error);
    if (!data) throw new HttpError(409, `Someone else just changed ${account.name}. Showing the latest.`);
  }
  if (action.type === "send") {
    const { error } = await sb.from("outreach").insert({ account_id: account.id, channel: action.channel, recipient: action.to, sent_by: action.actor, pdf: action.pdf });
    if (error) throw fail("log outreach", error);
  }
  await logEvent(account.id, action.actor, decision.event.type, decision.event.detail);
  return loadState();
}
