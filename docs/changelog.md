# Changelog

All notable changes to this project will be documented in this file.

Format: `- YYYY-MM-DD Short description (Task x.y)` then `Files: …`, grouped under **Added**, **Changed**, **Fixed**, **Removed**, **Security**. Add an entry after every completed task group. Never edit or delete past entries.

---

## 2026-10-24
### Added
- 2026-10-24 Project documentation: masterplan, implementation, design, app-flow, rules, tasks (Task 0.0)
  Files: docs/*.md

### Added
- 2026-10-24 Phase 1 complete: design tokens (light/dark), sample data, top bar with view toggle, computed headline and filter tabs, ranked account list, account detail (verdict, signals with sparklines, timeline, draft suggestion), owner/handled/not-a-risk actions with toasts, Slack preview, prototype footer (Tasks 1.1–1.9)
  Files: src/styles.css, src/data/accounts.ts, src/lib/brief.ts, src/lib/brief.test.ts, src/components/undertow/*, src/routes/index.tsx, src/routes/__root.tsx
- 2026-10-24 Phase 2 polish: tap a row on mobile scrolls to detail, dark mode follows system setting, "Nothing here." empty states, keyboard focus rings and live region on detail (Tasks 2.1–2.4)
  Files: src/routes/index.tsx
### Security
- 2026-10-24 Security scan clean (no backend). Dependency advisories are in build tooling only, not reachable in this static prototype. Published publicly (Task 2.5)
- Oct 24: Editorial redesign — serif headlines, 3-pane layout, keyboard shortcuts, ⌘K search, island notifications, spring motion, currency switcher.
- Oct 24: 2-font type system, compact Slack-style list, At a glance section, action buttons (Slack, email draft, sponsor sync, escalate)
- Oct 24: 3 tabs, At a glance with live numbers, Reach out in Slack message

## 2026-10-25
### Added
- Live Claude Sonnet email drafts in Reach out, based on account signals and timeline. Text streams into a separate proposal; human approval is required before replacing the message. Stop and failures preserve the original draft. Generation never sends messages or changes account status.
  Files: src/components/undertow/ClaudeDraft*, src/lib/ai/*, src/routes/api/draft.ts, src/components/undertow/AccountDetail.tsx
### Security
- Lovable Cloud stores server-only provider access denials; credentials and prompts remain on the server. Draft requests accept only known sample account identifiers and require same-origin requests. No real email, Slack, PDF or customer-data integrations were added.

## 2026-10-25 (Week 4)
### Added
- Persistence: accounts, account_events and outreach tables in Lovable Cloud. Owner changes, "I've reached out", "Not a real risk", sent messages and "replied" now survive a reload and are shared across browsers.
  Files: drizzle/migrations/0001_undertow_persistence.sql, src/integrations/supabase/types.ts, src/lib/undertow.server.ts, src/routes/api/brief.ts
- Business rules enforced on the server and covered by tests: only Marta assigns owners; a CSM acts only on accounts they own; an account can't be handled twice; reopen restores it; email closes an account, a Slack note doesn't.
  Files: src/lib/rules.ts, src/lib/rules.test.ts
- Activity list on each account, Reopen on handled accounts, "Reset sample week" link for reviewers.
  Files: src/components/undertow/AccountDetail.tsx, src/routes/index.tsx
### Changed
- The page loads data from /api/brief with loading and error states; actions update optimistically and roll back with a toast if the server refuses. Claude drafts use the saved account.
  Files: src/routes/index.tsx, src/lib/ai/draft.server.ts, src/data/outreach.ts
### Security
- Tables have RLS on with no client policies; only server routes (service role) touch them. Action payloads are validated with strict schemas and must come from the same origin. Role switching is a demo identity, not authentication.

### Fixed
- 2026-10-25 Applied the pending persistence migration in Lovable Cloud through a migration runner checkpoint; regenerated database types. Verified the first page load creates five sample accounts and three outreach records, which remain after reload. All 20 rules and brief tests pass (Task 4.8a).
  Files: drizzle/migrations/0002_apply_pending_undertow.sql, src/integrations/supabase/types.ts, docs/tasks.md, roadmap.md

## 2026-10-25 — Portfolio first
### Changed
- Portfolio is the default view, followed by Triage and Outreach. A compact ledger shows 50 saved sample accounts, ARR, risk, ownership, signals, contact dates and outreach state.
- Computed summaries filter the ledger; search, owner/risk filters and numeric sorting retain full-book totals. Account details open in place without losing filters or scroll.
- Customer email drafts have greeting/context/next-step paragraphs. Reach out distinguishes Email Customer from Slack CSM; both delivery paths remain simulated.
- Removed page-load sample creation, reset UI, fabricated historical comparison and remaining visible shortcut hints. Healthy open accounts stay out of the triage action queue.
### Added
- Repeatable sample expansion in docs/portfolio-samples.sql applied through the data tool (DDL migration tools cannot seed rows). Existing five accounts, ownership and activity remain untouched.
- Shared portfolio rules with nine tests; all 35 targeted tests pass. Browser checked summaries, 50-row reload, both demo roles, search/sorting and email/Slack recipients.
### Limitations
- Persona switching remains a demo, not authenticated access control. Contact dates derive from existing contact-age snapshots; never-contacted samples use an explicit timeline marker. No schema changes or publication.

### Changed
- Removed the inline demo-delivery sentence from Reach out at the owner's request; the page footer still identifies simulated delivery.
- Removed the repeated ARR-at-risk and unowned-account headline from Triage; shared portfolio totals and team load remain.
- Unified Portfolio, Triage and Outreach under one sticky header: consistent page title/date layout, role-scoped portfolio totals always visible, and summary links into the Portfolio ledger. View-specific queue and outreach context remain below. Verified identical totals across tabs, Devon scope, summary navigation and scrolling; 11 relevant tests pass.
  Files: src/components/undertow/WorkspaceHeader.tsx, src/components/undertow/Portfolio.tsx, src/components/undertow/Tracker.tsx, src/routes/index.tsx
- Added checkbox multi-select owner/risk filters to Portfolio and Triage, numeric/contact/name sorting, editable Portfolio owners and per-owner Slack nudge icons. Nudges use existing message activity, preserve customer contact/risk state and remain simulated for the work assignment. Owner edits also work on handled accounts without reopening them; Marta-only assignment is preserved. Browser verified combined filters, owner changes after reload and nudge activity readback. 38 targeted tests pass.

## 2026-10-25 — Analytics and team load
### Added
- Analytics page: one widget per portfolio metric (accounts, total ARR, at-risk ARR, unassigned at risk, average contact age, no contact 30+ days, never contacted, awaiting replies), each with a weekly trend line, change versus four weeks ago and a 6/12/26-week range. Clicking a widget opens that slice of the Portfolio ledger. History is clearly labelled sample data because the demo was seeded this week; the newest point on every line is today's live figure.
  Files: src/lib/analytics.ts, src/lib/analytics.test.ts, src/components/undertow/Analytics.tsx
- Team load page: a card per owner with ARR responsible, share of book ARR, needs-action load bar and per-person metrics (at risk, at-risk ARR, average contact age, 30+ days, never contacted, awaiting, stalled, handled, coverage), plus a workload split across the team. The no-owner pile is shown last and flagged. Marta can jump from a card to that person's accounts in the ledger; Devon sees only his own card.
  Files: src/lib/team.ts, src/lib/team.test.ts, src/components/undertow/TeamLoad.tsx
### Changed
- Navigation is now Portfolio · Triage · Outreach · Analytics · Team with the shared sticky header and portfolio totals unchanged on every page; the sliding tab indicator sizes itself from the number of views.
- The team-load line was removed from the Triage headline and now lives on the Team page; Triage keeps only the stalled-reply pointer.
  Files: src/routes/index.tsx, src/components/undertow/Portfolio.tsx
### Fixed
- Portfolio summary values no longer collide with the next column at narrow widths (eight columns only from 1536px, four below), and analytics widget footers keep their date range on one line.
  Files: src/components/undertow/WorkspaceHeader.tsx, src/components/undertow/Analytics.tsx
### Limitations
- No schema changes: weekly history is generated in the browser from live values, so it is illustrative rather than recorded. Publication not requested.

## 2026-10-25 — Sharper Claude use
- Playbook toggle (Exec sponsor / Technical blocker / Re-engagement) shapes email, Slack nudge and call prep drafts.
- Claude drafts Slack CSM nudges (with ARR and evidence) and three-line call prep.
- Account verdict shows churn likelihood, expected loss and salvageable ARR (deterministic sample estimate, src/lib/exposure.ts, tested).
