# Issue tracker: GitHub

Issues and specs live in GitHub Issues for `nomilious/video-meeting`. Use the `gh` CLI for all operations; it infers the repository from the Git remote when run inside this clone.

## Conventions

- Create: `gh issue create --title "..." --body-file <path>`; use a temporary file for multiline bodies.
- Read: `gh issue view <number> --comments`; fetch labels with `gh issue view <number> --json labels`.
- List: `gh issue list --state open --json number,title,body,labels,comments`, with appropriate label and state filters.
- Comment: `gh issue comment <number> --body-file <path>`.
- Apply or remove labels: `gh issue edit <number> --add-label "..."` or `--remove-label "..."`.
- Close: `gh issue close <number> --comment "..."`.

## Pull requests as a triage surface

**PRs as a request surface: no.**

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --comments`.
