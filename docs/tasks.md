# Undertow: Tasks

> Work top to bottom. Mark [x] when done and log in changelog.md.

## Phase 1 — The brief (challenge scope)
- [x] 1.1 Design tokens (light/dark), Public Sans + JetBrains Mono in Tailwind
- [x] 1.2 Sample data in src/data/accounts.ts (5 accounts from implementation.md)
- [x] 1.3 TopBar with view toggle
- [x] 1.4 BriefIntro with computed headline + FilterTabs with counts
- [x] 1.5 AccountList and AccountRow (rank, reason, tags, ARR, selected state)
- [x] 1.6 AccountDetail: Verdict, SignalGrid with sparklines, Timeline, Suggestion
- [x] 1.7 ActionBar: owner dropdown, "I've reached out", "Not a real risk", toasts, Handled tab
- [x] 1.8 SlackPreview with Monday brief and mid-week alert; buttons open the brief
- [x] 1.9 Prototype footer line

## Phase 2 — Polish
- [x] 2.1 Mobile layout (one column, tap scrolls to detail)
- [x] 2.2 Dark mode pass
- [x] 2.3 Empty states
- [x] 2.4 Keyboard and screen-reader pass (rows are buttons, live region on detail)
- [x] 2.5 Security scan and publish (public)

## Claude outreach drafts
- [x] Live Claude drafts grounded in sample account evidence, with server-only credentials
- [x] Human review with Use draft / Discard, streaming, Stop and safe failure states
- [x] Live generation verified; account safeguards and review/cancellation tests

## Week 4 — From prototype to product
- [x] 4.1 Data model: accounts, account_events, outreach (migration 0001), RLS on, service-role only
- [x] 4.2 Business rules in src/lib/rules.ts with tests (who can assign, handled needs a reason, no double handling, reopen)
- [x] 4.3 Server routes GET/POST /api/brief; first load seeds the sample week
- [x] 4.4 UI reads from the database: loading, error + retry, empty states
- [x] 4.5 Actions persist with optimistic update, rollback and error toast; conflict (409) refreshes
- [x] 4.6 Activity list per account, Reopen, Reset sample week
- [x] 4.7 Claude drafts read the saved account, not the static sample
- [x] 4.8a Apply migration in Lovable Cloud; verify five sample accounts and three outreach records on first load and reload; 20 existing rules/brief tests pass
- [x] 4.8b Request publication of the verified app
- [ ] 4.8c Verify completed deployment and any additional PR acceptance checks (deployment pending; PR checks not supplied)

## Portfolio-first experience
- [x] Portfolio opens first, with team/CSM totals, 50 saved samples and compact account rows.
- [x] Actionable summary filters, owner/risk search, ARR/contact sorting and in-place detail preserve list context.
- [x] Contact-age calculations exclude never-contacted accounts; risk is distinct from handled outreach.
- [x] Customer email paragraphs and separate Email Customer / Slack CSM recipient controls.
- [x] 35 tests pass; browser verifies both demo roles, summaries, detail round-trip and 50 accounts after reload. No publication requested.
- [x] Multi-select filters in both views, saved inline owner edits and simulated Slack nudge activity; 38 targeted tests pass.
