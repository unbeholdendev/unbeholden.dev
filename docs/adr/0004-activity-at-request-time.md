# Activity is fetched from GitHub when the page is served, and cached

The Work page shows what I'm working on now: each item's latest public commit, and a feed of
recent commits, with pull requests to other people's repos listed apart. That data changes
daily and the site is only deployed by hand, so it cannot be committed or fetched at build the way ADR-0001 handles
posters. `/work` is rendered on the server instead, and the homepage's one-line summary is a
server island. The browser still talks only to this origin, so the dependency budget holds:
GitHub is called by the server, never by the reader.

This ends ADR-0001's "every page is prerendered": the analytics proxy is no longer the only
thing that must run.

One GraphQL query, authenticated with `GITHUB_TOKEN`, returns the latest 30 commits of each
public repo I own and pull requests I opened
on repos I don't own. REST was rejected because it needs a call per repo. The query takes
seconds, so the result is held in memory for an hour and served stale while it
refreshes. A failed refresh keeps the last good result and is retried after five minutes, not
on every request. A cold container waits three seconds and then
renders the page without activity rather than keep a reader waiting; the fetch carries on and
fills the cache. Nothing is persisted, because a restart costs one fetch.

The repos on GitHub are mirrors of Forgejo, where the pull requests live, so work on them is
read as squash commits, all of them: a filter would need tuning, and a dull commit costs a line.
Contributions are listed apart, newest first and with no window, because they are few and they
are the part someone else reviewed.

## Consequences

Leave `GITHUB_TOKEN` unset and the page renders as it did before, with no dates and no feed.
A token with no scopes is enough, since every read is of public data. GitHub being down
costs the feed and the ordering, never the page.
