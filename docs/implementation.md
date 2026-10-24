# Undertow: Implementation

## Architecture
- Lovable (React + TypeScript + Tailwind), frontend only
- All data is local sample data in `src/data/accounts.ts`; state in React (no backend, no auth)
- Two views in one page: Weekly brief (default) and Slack preview

## Data model (sample, in code)
**Account:** id, name, arr (€/yr), level (high | rising | calm), underRadar (bool), owner ("Unassigned" | CSM name), lastTouchDays, reason (one line), verdict (one sentence), signals[], timeline[], suggestion (draft text), status (open | handled), handledNote
**Signal:** label, value, severity (bad | warn | none), source, series (8 numbers for a sparkline, optional)
**TimelineEvent:** when, text, source, warning (bool)
**CSMs:** Unassigned, Marta, Devon, Aisha, Tomás

## Sample data (fictional companies)
1. **Brightline Logistics**, €18k, high, under the radar, no owner, last touch 47 days. Reason: "Usage down 41%, 3 tickets in 14 days, champion silent 23 days". Verdict: "High risk, and nobody is on it. This is the same pattern as the two accounts you lost in Q3." Signals: WAU −41% (Product usage), Tickets 14d: 3 (Intercom), Ticket tone: Negative (Intercom), Champion last active: 23 days ago (HubSpot). Timeline: usage at lowest point (today); ticket "Export keeps failing, this is the third time" (3 days); ticket "Who is our account manager now?" (9 days); renewal set 30 Nov (16 days); champion Sam Patel last replied (23 days); last CSM touch QBR (47 days). Draft: short email to Sam offering 20 minutes to fix the export issue before renewal.
2. **Pequod Analytics**, €7.8k, high, under the radar, no owner, 38 days. Reason: "Champion changed jobs, usage down 30% this week". Signals: WAU −30%, Champion: Changed jobs (LinkedIn via HubSpot), Other active users: 0 this month, Tickets: 0.
3. **Northvale Bank**, €52k, rising, owner Aisha, 6 days. Reason: "Ticket volume doubled, tone turning negative". Signals: Tickets 8 (rising), Tone mixed → negative, WAU −4%, Champion active 2 days ago. Timeline includes "SSO outage blocked our whole team this morning" and a Slack escalation.
4. **Fernway Health**, €9.6k, rising, owner Devon, 12 days. Reason: "Usage down 18% after their team reorganised". Signals: WAU −18%, Seats 24 of 40, Tickets 1, Champion active 4 days ago.
5. **Tessel Retail**, €3.1k, already handled: "Marta called · usage back to normal".

## Screens → components
`TopBar`, `ViewToggle`, `BriefIntro` (headline computed from data), `FilterTabs`, `AccountList` / `AccountRow`, `AccountDetail` (`Verdict`, `SignalGrid` / `SignalCard` + `Sparkline`, `Timeline`, `Suggestion`, `ActionBar`), `SlackPreview`, `Toast`

## Phases
1. **Phase 1, the brief (challenge scope):** list, detail, filters, actions, Slack preview, sample data
2. **Phase 2, polish:** dark mode check, mobile layout, empty states, keyboard navigation, small transitions
