# Project Rules & Decisions

Single source of truth for project-wide decisions. Update immediately when a decision is made; if a decision overrides a previous one, edit the entry. One line each.

## Product
- Undertow never contacts customers. Suggestions are drafts for a human to send
- It is not a dashboard: the brief is pushed (Slack preview is part of the prototype)
- Every signal shows its source tool
- Verdicts are one plain sentence; no risk scores or percentages of "health"

## Architecture
- Account data/actions remain a frontend prototype with no app login or real sending; Claude drafts are generated live through a server-only Lovable Cloud integration from fixed sample account evidence.
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

## Portfolio
- Portfolio is the default view; navigation is Portfolio · Triage · Outreach. Triage filters stay in Triage, not a sidebar.
- Summary totals are computed from the role-scoped full book; filtered count and ARR are shown separately.
- At-risk ARR includes high/rising accounts even after outreach is handled, unless explicitly marked not a real risk. Handled is workflow state, not recovery evidence.
- Average contact age excludes never-contacted records and displays its denominator. No contact for 30+ days excludes never-contacted records, which are a separate segment.
- Waiting/stalled totals count messages; account filters deduplicate accounts. Stalled means awaiting a reply for at least five days.
- Email Customer addresses a customer; Slack CSM addresses the internal owner/team. Email drafts use paragraphs. Sending and attachments remain simulated.
