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
