# Undertow

I want to build Undertow for Customer Success leads at growing B2B SaaS companies. The Problem: CS teams own more accounts than they can watch. The signals that predict churn already exist (usage dropping, support tickets piling up, negative ticket tone, the champion going quiet) but they live in separate tools: Intercom, product analytics, HubSpot and Slack. Nobody connects them, so attention goes to whoever shouts loudest in Slack, and quiet accounts churn unnoticed. One customer lost an €18k account after three complaints nobody linked together. Who will use it: - Head of Customer Success (weekly, Monday morning) – decides where the team spends its time this week - Customer Success Managers (daily) – act on the accounts assigned to them Core workflows: 1. Monday 08:30 a brief arrives in Slack → "4 accounts need you this week" → Marta opens it 2. She sees accounts ranked by risk, each with a one-line reason → opens the top one → sees the connected signals, a timeline, and a plain verdict 3. She assigns an owner, or marks "I've reached out" (moves to Handled) or "Not a real risk" (tunes future signals) 4. She checks "Under the radar": accounts with no owner and no CSM contact in 30+ days Success criteria: - Marta knows where to look within 2 minutes of opening the brief - 100% of high-risk accounts have an owner by Monday noon - Fewer than 1 in 10 flagged accounts marked "Not a real risk" Constraints from the research: this must not feel like another dashboard (it pushes to Slack), and it never contacts a customer itself (it only suggests a draft for a human to send). This is a UI prototype: use realistic sample data, no backend or real integrations. Follow the design system in docs/design.md (attached screenshots show the intended look). Start with Phase 1 in docs/tasks.md only.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://quiet-risk-finder.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/896eb997-579e-4cd8-adfd-2ef9ace17a0b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
