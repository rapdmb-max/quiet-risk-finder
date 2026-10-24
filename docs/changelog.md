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
