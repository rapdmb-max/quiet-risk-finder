export interface Outreach {
  id: string;
  accountId: string;
  account: string;
  channel: "Email" | "Slack";
  to: string;
  by: string;
  daysAgo: number;
  pdf: boolean;
  status: "waiting" | "replied";
}

export const SEED_OUTREACH: Outreach[] = [
  { id: "o1", accountId: "tessel", account: "Tessel Retail", channel: "Email", to: "ops lead", by: "Marta", daysAgo: 3, pdf: false, status: "replied" },
  { id: "o2", accountId: "northvale", account: "Northvale Bank", channel: "Slack", to: "Aisha", by: "Marta", daysAgo: 1, pdf: false, status: "waiting" },
  { id: "o3", accountId: "fernway", account: "Fernway Health", channel: "Email", to: "IT director", by: "Devon", daysAgo: 6, pdf: true, status: "waiting" },
];
