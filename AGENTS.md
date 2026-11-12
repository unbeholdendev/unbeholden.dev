# unbeholden.dev

Astro 7 static site, Tailwind 4 via `@tailwindcss/vite`. Bun is the package manager
(`bun.lock`); `bun run check` type-checks; `bun run lint` runs Biome, which skips `.astro` files.

Server code reads secrets and upstream URLs from `process.env`, never `import.meta.env`,
which Vite freezes into the build.

## Agent skills

### Issue tracker

Issues live in Forgejo at `git.home.unbeholden.dev/unbeholden/unbeholden.dev`, driven by `tea`.
See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
