# Undertow: Masterplan

> The North Star. Read this before changing anything else.

## 1. One sentence
Undertow tells a Customer Success lead which accounts need her this week, and why, before they quietly churn.

## 2. Problem
CS teams at growing B2B SaaS companies own more accounts than they can watch. The warning signs (usage falling, tickets piling up, tone souring, the champion going quiet) already exist but sit in separate tools. Nobody connects them, so attention goes to the loudest and largest accounts, and the quiet ones churn. By the time a human notices, the customer has already decided to leave. It's an attention problem, not a data problem.

## 3. Persona (from Week 1)
**Marta, Head of Customer Success**, 40-person B2B SaaS. ~120 accounts, 4 CSMs, no analyst. Owns the net revenue retention number.
- **Goals:** spot at-risk accounts while they can still be saved; decide where CSM time goes on evidence, not gut feel; watch small accounts as closely as big ones.
- **Pains:** copy-pastes between four tools to understand one customer; missed the pattern on an €18k account until after it cancelled; Monday prioritisation is whoever shouted loudest; has abandoned three tools that became shelfware.
- **Quote:** "I don't need AI to solve the problem for me, I just need it to tell me where to look."

Secondary users: CSMs like Devon, who act on assigned accounts. Senior variant: VPs like Priya, who care most about accounts nobody is watching.

## 4. Value proposition
- **Where to look, ranked:** a short list, each with one plain reason.
- **Signals connected:** usage, tickets, tone and champion activity from four tools, side by side, with a timeline.
- **Comes to you:** the brief arrives in Slack on Monday; urgent changes arrive mid-week. Not another dashboard.
- **Human in charge:** suggests a draft message; never contacts a customer.
- **Under the radar:** surfaces accounts with no owner and no recent contact.

## 5. Scope
**Prototype (this build, UI only, sample data):**
- Weekly brief: ranked account list with filters (This week, Under the radar, Handled)
- Account detail: verdict, connected signals with sparklines, timeline, suggested next step, actions
- Actions: assign owner, "I've reached out", "Not a real risk"
- Slack preview: Monday brief message and a mid-week alert

**Not in the prototype:** real customer-data integrations, login, risk model, settings, sending messages. Claude email drafting is a live, human-reviewed exception; it never sends messages or changes account status.

## 6. Success metrics
- Time to first action after opening the brief: under 2 minutes
- High-risk accounts with an owner by Monday noon: 100%
- Flagged accounts marked "Not a real risk": under 10% (signal quality)
- Still opening the brief in week 5 (the shelfware test): 80%+ of CS leads
