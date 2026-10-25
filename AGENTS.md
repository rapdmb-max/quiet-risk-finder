<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Accounts, actions and outreach persist in Lovable Cloud, accessed only by server routes (`src/routes/api/brief.ts` → `src/lib/undertow.server.ts`). Business rules live in `src/lib/rules.ts`; add a rule there with a test before adding an action. Never grant tables to the browser.
- Never add, rename or drop a table or column without asking the owner: the data model is a product decision (see docs/rules.md).
- Claude draft generation is the live LLM integration, isolated in server-only AI modules behind a same-origin streaming endpoint to keep credentials and prompts private.
- Claude uses native Messages through Lovable AI Gateway; terminal provider access denials persist in a server-only Cloud table so reloads cannot replay blocked calls.
- Product docs live in /docs (masterplan, tasks, rules, changelog); mark tasks and log changes there after each task group.
- Portfolio metrics and filters use pure shared rules; portfolio detail opens in place so the ledger retains filters and scroll position.
- Render the workspace title and role-scoped portfolio totals once in the shared sticky header; summary actions open the Portfolio segment so every view retains the same context and calculations.
- Sample expansion uses an idempotent data-import script, never page-load seeding; existing records and activity must remain intact.
- Contact dates derive from the stored contact-age snapshot and its update timestamp; an explicit no-contact timeline record represents never-contacted accounts without schema changes.
- Share checkbox multi-select controls and portfolio sorting rules between Portfolio and Triage; simulated nudges use the existing message activity type to avoid schema changes.
