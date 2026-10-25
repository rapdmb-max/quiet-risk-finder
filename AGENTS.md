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
- Account data and actions remain a frontend prototype; Claude draft generation is the sole live integration, isolated in server-only AI modules behind a same-origin streaming endpoint to keep credentials and prompts private.
- Claude uses native Messages through Lovable AI Gateway; terminal provider access denials persist in a server-only Cloud table so reloads cannot replay blocked calls.
- Product docs live in /docs (masterplan, tasks, rules, changelog); mark tasks and log changes there after each task group.
