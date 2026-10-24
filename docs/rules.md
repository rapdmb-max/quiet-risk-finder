# Project Rules & Decisions

Single source of truth for project-wide decisions. Update immediately when a decision is made; if a decision overrides a previous one, edit the entry. One line each.

## Product
- Undertow never contacts customers. Suggestions are drafts for a human to send
- It is not a dashboard: the brief is pushed (Slack preview is part of the prototype)
- Every signal shows its source tool
- Verdicts are one plain sentence; no risk scores or percentages of "health"

## Architecture
- Frontend only (React + TS + Tailwind); sample data in src/data/accounts.ts; no backend, no auth, no real integrations
- Companies and people in sample data are fictional; show a small line: "Clickable prototype with sample data. Companies and people are fictional."

## Naming
- Components PascalCase; data fields camelCase
- Product name "Undertow"; persona "Marta"

## Design
- Follow docs/design.md; never add colours. Two fonts: Public Sans (400/600) + JetBrains Mono for data; scale 13/15/17/28; no italics
- Red/amber/green only for risk levels
- "Under the radar" tag is solid ink, always
- Money and dates in JetBrains Mono
- Light and dark mode both supported
- Editorial redesign (user-approved): 3-pane layout (sidebar · list · detail) from 1180px, spring motion, top "island" notifications instead of bottom toast
- Keyboard: J/K or arrows move, E reached out, X not a risk, 1–3 filters, ⌘K search
- Currency switcher €/$/£; ARR stored in euros, converted with fixed sample rates (USD 1.08, GBP 0.85)
