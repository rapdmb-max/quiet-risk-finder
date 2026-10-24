# Undertow: Design

> A weekly brief, not a dashboard. Calm, editorial, decisive. Colour only means risk.

## Principles
- Lead with the answer: the page opens with a sentence ("4 accounts need you this week. 2 of them nobody has looked at in a month."), not charts.
- A ranked list, not a grid of tiles. Rank numbers in mono (01, 02…).
- Every claim shows its source (Intercom, Product usage, HubSpot, Slack) in small mono text.
- Colour carries meaning only: red = high risk, amber = rising, green = healthy. Never decorative.
- One primary action per area. Secondary actions are outlined.

## Colour tokens
| Token | Light | Dark | Use |
|---|---|---|---|
| bg | #F5F4F0 | #111215 | Page |
| panel | #FFFFFF | #191B1F | List and detail cards |
| ink | #16181D | #ECEDEF | Text, primary buttons, selected tab |
| muted | #5F636B | #A1A5AD | Secondary text, sources |
| line | #E2E0D9 | #2C2F35 | Borders, dividers |
| soft | #EEECE6 | #22252A | Hover, selected row |
| risk / risk-soft | #B4321F / #F6E3DF | #F08A76 / #3A221E | High risk |
| rising / rising-soft | #A86A0A / #F5EAD3 | #E3AE52 / #352A17 | Rising risk |
| calm / calm-soft | #2E6B57 / #E0EDE7 | #7FC3A8 / #1C2E27 | Healthy, handled |

## Type
- **Public Sans** (400/500/600/700) for everything
- **JetBrains Mono** 500 for dates, rank numbers, sources, money (€18k/yr)
- Headline 34px/700, tracking −2.5%; account name in detail 26px/700; list names 16px/600; body 15px

## Components
- **Top bar:** logo (two wave lines + "Undertow"), segmented toggle "Weekly brief / How it reaches Marta", team name + avatar
- **Intro:** mono date line, headline sentence (second half in risk red), one-line explanation, filter pills with counts
- **Account row:** rank · name · one-line reason · tags (risk level, "Under the radar" in solid ink, owner) · ARR right-aligned in mono. Selected row: soft fill + 3px ink left border
- **Verdict box:** risk-soft background, bold one-sentence verdict, then "Four signals, from three tools, pointing the same way."
- **Signal card:** label, big value coloured by severity, sparkline, source in mono. 2×2 grid
- **Timeline:** vertical line, red dots for warning events, grey for neutral; date in mono, event text, source
- **Suggested next step:** dashed box with a draft message; note "A draft for you to edit and send yourself. Undertow never contacts customers."
- **Actions:** owner dropdown, primary "I've reached out", outlined "Not a real risk"
- **Toast:** ink background, bottom centre, 3 seconds
- **Slack preview:** channel header "# cs-team", bot avatar, message with numbered accounts, green "Open the brief" button

## Layout
- Max width 1240px. Desktop: list 5/12, detail 7/12. Below 900px: one column, list then detail
- Radii: 8–10px cards, 999px pills. No shadows except the toast
- Light and dark mode both required
