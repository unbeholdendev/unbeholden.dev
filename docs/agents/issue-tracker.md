# Issue tracker: Forgejo (via MCP)

Issues and specs for this repo live as Forgejo issues at
`https://git.home.unbeholden.dev/unbeholden/unbeholden.dev`.

Neither `gh` nor `glab` applies, and no Forgejo CLI is installed. **Use the `forgejo` MCP
tools for every operation.** Their schemas are deferred, so load them first, e.g.
`ToolSearch("select:mcp__forgejo__create_issue,mcp__forgejo__list_repo_issues")`.

Every tool takes `owner` and `repo`, which are not inferred from `git remote`:

- `owner`: `pycan`
- `repo`: `unbeholden.dev`

## Conventions

- **Create an issue**: `mcp__forgejo__create_issue` with `title` and `body`. It takes no
  `labels` argument; label the issue afterwards in a second call.
- **Read an issue**: `mcp__forgejo__get_issue_by_index` with `index`, then
  `mcp__forgejo__list_issue_comments` for the thread. `index` is the `#number`.
- **List issues**: `mcp__forgejo__list_repo_issues` with `state` (`open`/`closed`/`all`),
  `labels` (comma-separated names) and `type` (`issues` or `pulls`).
- **Comment**: `mcp__forgejo__create_issue_comment`.
- **Apply / remove labels**: `mcp__forgejo__add_issue_labels` and
  `mcp__forgejo__remove_issue_labels` both take comma-separated numeric label *IDs*, not
  names. Get the IDs from `mcp__forgejo__list_repo_labels`.
- **Close**: post the explanation with `create_issue_comment`, then
  `mcp__forgejo__issue_state_change` with `state: "closed"`. State changes carry no comment.
- **Assign**: `mcp__forgejo__update_issue` with `assignee`. There is no `@me`; pass the
  username from `mcp__forgejo__get_my_user_info`.
- **Labels**: `mcp__forgejo__list_repo_labels` must be called with
  `include_org_labels: false`. The token lacks the `read:organization` scope, so the
  default (`true`) fails with a 403 on the `pycan` org.
- **Create a label**: `mcp__forgejo__create_repo_label` with `name` and a 6-digit hex
  `color`.

Forgejo shares one index space across issues and pull requests, so a bare `#42` may be
either. Resolve with `mcp__forgejo__get_pull_request_by_index` and fall back to
`get_issue_by_index`.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as
feature requests; `/triage` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues:

- **Read a PR**: `mcp__forgejo__get_pull_request_by_index`, plus
  `mcp__forgejo__get_pull_request_diff` for the diff and
  `mcp__forgejo__list_issue_comments` for the thread.
- **List PRs for triage**: `mcp__forgejo__list_repo_pull_requests`, then drop PRs authored
  by maintainers. Forgejo reports no `authorAssociation`; check the author against
  `mcp__forgejo__list_org_members` where the token allows it, otherwise judge by hand.
- **Label / comment / close**: the issue tools work on PR indexes too
  (`add_issue_labels`, `create_issue_comment`, `issue_state_change`).

## When a skill says "publish to the issue tracker"

Create a Forgejo issue with `mcp__forgejo__create_issue`.

## When a skill says "fetch the relevant ticket"

`mcp__forgejo__get_issue_by_index`, then `mcp__forgejo__list_issue_comments`.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: one issue labelled `wayfinder:map`, holding the Notes / Decisions-so-far / Fog
  body. Create it, then add the label.
- **Child ticket**: an issue with `Part of #<map>` at the top of its body, listed in a task
  list in the map body. The MCP server exposes no sub-issue endpoint. Labels:
  `wayfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket
  is assigned to the driving dev.
- **Blocking**: a `Blocked by: #<n>, #<n>` line at the top of the child body. Forgejo has
  native issue dependencies, but no MCP tool reaches them, so the body line is canonical
  here. A ticket is unblocked when every blocker is closed.
- **Frontier query**: `list_repo_issues` with `state: "open"`, scoped to the map's task
  list; drop any ticket with an open issue in its `Blocked by` line or with an assignee.
  First in map order wins.
- **Claim**: `update_issue` with `assignee: "<your username>"`, the session's first write.
- **Resolve**: `create_issue_comment` with the answer, then `issue_state_change` to
  `closed`, then append a context pointer to the map's Decisions-so-far.
