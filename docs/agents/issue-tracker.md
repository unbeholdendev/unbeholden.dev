# Issue tracker: Forgejo (via `tea`)

Issues and specs for this repo live as Forgejo issues at
`https://git.home.unbeholden.dev/unbeholden/unbeholden.dev`.

Use `tea` for every operation, from inside the repo so it infers the repo from `git remote`.
Add `--output json` when you need to parse the result. `gh` and `glab` don't apply. For
anything `tea` lacks, use `tea api <path>`, for example
`tea api repos/unbeholden/unbeholden.dev/issues/60/comments`.

## Conventions

- **Create an issue**: `tea issues create --title <title> --description-file <file>`, with
  `--labels <names>` to label it in the same call.
- **Read an issue**: `tea issues <index>`, then `tea api` on its `comments` for the thread.
  `index` is the `#number`.
- **List issues**: `tea issues list --state open|closed|all --labels <names>`.
- **Comment**: `tea comment <index> <body>`.
- **Apply / remove labels**: `tea issues edit <index> --add-labels <names>` or
  `--remove-labels <names>`. Both take comma-separated names.
- **Close**: post the explanation with `tea comment`, then `tea issues close <index>`.
- **Assign**: `tea issues edit <index> --add-assignees <username>`. Get your username from
  `tea whoami`.
- **Labels**: `tea labels list`.
- **Create a label**: `tea labels create --name <name> --color <6-digit hex>`.

Forgejo shares one index space across issues and pull requests, so a bare `#42` may be
either. Check with `tea api repos/unbeholden/unbeholden.dev/pulls/42`, which returns 404 for
an issue.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as
feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues:

- **Read a PR**: `tea api repos/unbeholden/unbeholden.dev/pulls/<index>`, plus
  `tea pr review-comments <index>` for review comments and `tea api` on the issue's
  `comments` for the thread. Add `.diff` to the `pulls/<index>` path for the diff.
- **List PRs for triage**: `tea pr list --state open`, then drop PRs authored by
  maintainers. Forgejo reports no `authorAssociation`; check the author against
  `tea api orgs/unbeholden/members` where the token allows it, otherwise judge by hand.
- **Label / comment / close**: the issue commands work on PR indexes too.

## When a skill says "publish to the issue tracker"

Create a Forgejo issue with `tea issues create`.

## When a skill says "fetch the relevant ticket"

`tea issues <index>`, then `tea api` on its `comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: one issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog
  body.
- **Child ticket**: an issue with `Part of #<map>` at the top of its body, listed in a task
  list in the map body. Labels: `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`).
  Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: a `Blocked by: #<n>, #<n>` line at the top of the child body. It is canonical
  here, rather than Forgejo's native issue dependencies. A ticket is unblocked when every
  blocker is closed.
- **Frontier query**: `tea issues list --state open`, scoped to the map's task list; drop any
  ticket with an open issue in its `Blocked by` line or with an assignee. First in map order
  wins.
- **Claim**: `tea issues edit <index> --add-assignees <your username>`, the session's first
  write.
- **Resolve**: `tea comment` with the answer, then `tea issues close`, then append a context
  pointer to the map's Decisions-so-far.
