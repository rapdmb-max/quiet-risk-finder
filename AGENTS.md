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
- Undertow is frontend-only: sample data lives in src/data/accounts.ts and brief rules (filters, counts, headline) in src/lib/brief.ts — keeps the prototype backend-free and the rules testable.
- Product docs live in /docs (masterplan, tasks, rules, changelog); mark tasks and log changes there after each task group.
