# Undertow: App Flow

## Views
1. **Weekly brief** (default): intro + filter tabs + account list (left) + account detail (right)
2. **How it reaches Marta**: Slack channel preview with two bot messages

## Journeys
**A. Monday brief:** Slack message "Good morning Marta. 4 accounts need you this week. 2 haven't had a CSM touch in 30+ days." with a numbered list → "Open the brief" → Weekly brief view, top account selected.
**B. Understand one account:** click a row → detail shows verdict, 4 signal cards with sources, timeline, suggested next step.
**C. Act:** change owner (toast "Assigned to Devon. They'll get a Slack message with this summary.") / "I've reached out" (moves to Handled, toast "Marked as handled. Undertow will tell you if the signals don't improve in 14 days.") / "Not a real risk" (moves to Handled, toast "Got it. Undertow will weigh these signals less for this account.").
**D. Under the radar:** filter shows only accounts with no owner and no recent contact. Assigning an owner removes the tag.
**E. Mid-week alert:** second Slack message "Pequod Analytics just moved to high risk…" → "See why" opens Pequod in the brief.

## State rules
- Headline counts are computed: "N accounts need you this week. M of them nobody has looked at in a month." When N = 0: "You're clear for this week. Nothing needs you right now."
- Tab counts update after every action.
- After an action, select the next account in the current filter.
- The Slack message list mirrors the open accounts.

## Edge cases
- Empty filter: "Nothing here."
- Handled account selected: show its note and "Undertow keeps watching and will flag it again only if the signals change."
- Mobile: tapping a row scrolls to the detail.
