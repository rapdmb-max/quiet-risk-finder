export type Level = "high" | "rising" | "calm";
export type Severity = "bad" | "warn" | "none";

export interface Signal {
  label: string;
  value: string;
  severity: Severity;
  source: string;
  series?: number[];
}

export interface TimelineEvent {
  when: string;
  text: string;
  source: string;
  warning: boolean;
}

export interface Account {
  id: string;
  name: string;
  arr: number;
  level: Level;
  underRadar: boolean;
  owner: string;
  lastTouchDays: number;
  reason: string;
  verdict: string;
  signals: Signal[];
  timeline: TimelineEvent[];
  suggestion: string;
  status: "open" | "handled";
  handledNote?: string;
}

export const CSMS = ["Unassigned", "Marta", "Devon", "Aisha", "Tomás"];
export const BRIEF_DATE = "Monday 27 Oct";
export const ACCOUNTS_WATCHED = 128;

export function formatArr(arr: number) {
  const k = arr / 1000;
  return `€${Number.isInteger(k) ? k : k.toFixed(1)}k`;
}

export const accounts: Account[] = [
  {
    id: "brightline",
    name: "Brightline Logistics",
    arr: 18000,
    level: "high",
    underRadar: true,
    owner: "Unassigned",
    lastTouchDays: 47,
    reason: "Usage down 41%, 3 tickets in 14 days, champion silent 23 days",
    verdict:
      "High risk, and nobody is on it. This is the same pattern as the two accounts you lost in Q3.",
    signals: [
      { label: "Weekly active users", value: "−41%", severity: "bad", source: "Product usage", series: [62, 61, 60, 58, 52, 47, 42, 37] },
      { label: "Support tickets, 14 days", value: "3", severity: "bad", source: "Intercom", series: [0, 0, 1, 0, 0, 1, 1, 1] },
      { label: "Ticket tone", value: "Negative", severity: "bad", source: "Intercom" },
      { label: "Champion last active", value: "23 days ago", severity: "warn", source: "HubSpot" },
    ],
    timeline: [
      { when: "Today", text: "Usage at lowest point since onboarding", source: "Product usage", warning: true },
      { when: "3 days ago", text: "Ticket: “Export keeps failing, this is the third time”", source: "Intercom", warning: true },
      { when: "9 days ago", text: "Ticket: “Who is our account manager now?”", source: "Intercom", warning: true },
      { when: "16 days ago", text: "Renewal date set: 30 Nov", source: "HubSpot", warning: false },
      { when: "23 days ago", text: "Champion Sam Patel last replied", source: "HubSpot", warning: false },
      { when: "47 days ago", text: "Last CSM touch: quarterly review", source: "HubSpot", warning: false },
    ],
    suggestion:
      "Hi Sam, I saw the export issue has come up a few times. That's on us, and I'm sorry. Could I grab 20 minutes this week to fix it with your team before the renewal on 30 Nov?",
    status: "open",
  },
  {
    id: "pequod",
    name: "Pequod Analytics",
    arr: 7800,
    level: "high",
    underRadar: true,
    owner: "Unassigned",
    lastTouchDays: 38,
    reason: "Champion changed jobs, usage down 30% this week",
    verdict:
      "High risk: their champion left, and nobody else on their team is using the product.",
    signals: [
      { label: "Weekly active users", value: "−30%", severity: "bad", source: "Product usage", series: [20, 21, 20, 19, 20, 18, 17, 12] },
      { label: "Champion", value: "Changed jobs", severity: "bad", source: "LinkedIn via HubSpot" },
      { label: "Other active users", value: "0 this month", severity: "warn", source: "Product usage" },
      { label: "Support tickets, 14 days", value: "0", severity: "none", source: "Intercom", series: [0, 0, 0, 0, 0, 0, 0, 0] },
    ],
    timeline: [
      { when: "2 days ago", text: "Usage fell 30% week on week", source: "Product usage", warning: true },
      { when: "4 days ago", text: "Champion Lena Ortiz changed jobs", source: "HubSpot", warning: true },
      { when: "21 days ago", text: "Lena's last login", source: "Product usage", warning: false },
      { when: "38 days ago", text: "Last CSM touch: check-in email", source: "HubSpot", warning: false },
    ],
    suggestion:
      "Hi Jonas, Lena mentioned you as a key user before she moved on. Would you be open to a quick call so we can make sure your team keeps getting value without her?",
    status: "open",
  },
  {
    id: "northvale",
    name: "Northvale Bank",
    arr: 52000,
    level: "rising",
    underRadar: false,
    owner: "Aisha",
    lastTouchDays: 6,
    reason: "Ticket volume doubled, tone turning negative",
    verdict:
      "Rising risk: an SSO outage frustrated their team, but the champion is still engaged.",
    signals: [
      { label: "Support tickets, 14 days", value: "8", severity: "bad", source: "Intercom", series: [1, 0, 1, 1, 2, 3, 4, 5] },
      { label: "Ticket tone", value: "Mixed → negative", severity: "warn", source: "Intercom" },
      { label: "Weekly active users", value: "−4%", severity: "none", source: "Product usage", series: [410, 412, 408, 411, 405, 402, 398, 394] },
      { label: "Champion last active", value: "2 days ago", severity: "none", source: "HubSpot" },
    ],
    timeline: [
      { when: "Yesterday", text: "Escalation posted in #ext-northvale", source: "Slack", warning: true },
      { when: "2 days ago", text: "Ticket: “SSO outage blocked our whole team this morning”", source: "Intercom", warning: true },
      { when: "5 days ago", text: "Ticket volume passes 2× their normal", source: "Intercom", warning: true },
      { when: "6 days ago", text: "Aisha's weekly sync with IT lead", source: "HubSpot", warning: false },
    ],
    suggestion:
      "Hi Priya, I know the SSO outage hit your team hard this week. I'd like to walk you through what happened and what we've changed. Does Thursday work?",
    status: "open",
  },
  {
    id: "fernway",
    name: "Fernway Health",
    arr: 9600,
    level: "rising",
    underRadar: false,
    owner: "Devon",
    lastTouchDays: 12,
    reason: "Usage down 18% after their team reorganised",
    verdict: "Rising risk: a reorg left 16 seats empty, and usage is following.",
    signals: [
      { label: "Weekly active users", value: "−18%", severity: "warn", source: "Product usage", series: [30, 31, 30, 29, 28, 27, 25, 24] },
      { label: "Seats in use", value: "24 of 40", severity: "warn", source: "Product usage" },
      { label: "Support tickets, 14 days", value: "1", severity: "none", source: "Intercom", series: [0, 0, 0, 1, 0, 0, 0, 0] },
      { label: "Champion last active", value: "4 days ago", severity: "none", source: "HubSpot" },
    ],
    timeline: [
      { when: "4 days ago", text: "Seat usage drops to 24 of 40", source: "Product usage", warning: true },
      { when: "10 days ago", text: "Champion mentions team reorganisation", source: "Slack", warning: false },
      { when: "12 days ago", text: "Devon's monthly check-in", source: "HubSpot", warning: false },
    ],
    suggestion:
      "Hi Ana, congrats on the new team structure. Happy to help re-onboard the new leads so nobody loses momentum. Want me to set up a 30-minute session?",
    status: "open",
  },
  {
    id: "tessel",
    name: "Tessel Retail",
    arr: 3100,
    level: "calm",
    underRadar: false,
    owner: "Marta",
    lastTouchDays: 3,
    reason: "Usage dipped for two weeks after a billing change",
    verdict: "Handled: usage is back to its normal level.",
    signals: [
      { label: "Weekly active users", value: "+2%", severity: "none", source: "Product usage", series: [14, 13, 10, 9, 11, 13, 14, 14] },
      { label: "Support tickets, 14 days", value: "0", severity: "none", source: "Intercom", series: [1, 1, 0, 0, 0, 0, 0, 0] },
      { label: "Ticket tone", value: "Neutral", severity: "none", source: "Intercom" },
      { label: "Champion last active", value: "Today", severity: "none", source: "HubSpot" },
    ],
    timeline: [
      { when: "3 days ago", text: "Marta called their ops lead", source: "HubSpot", warning: false },
      { when: "14 days ago", text: "Usage dipped after billing change", source: "Product usage", warning: true },
    ],
    suggestion: "",
    status: "handled",
    handledNote: "Marta called · usage back to normal",
  },
];

export const levelRank: Record<Level, number> = { high: 0, rising: 1, calm: 2 };
