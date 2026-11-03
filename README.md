# unbeholden.dev

The source of [unbeholden.dev](https://unbeholden.dev), my blog and the list of things I've
built. Astro 7 with Tailwind 4, run on Bun. Most pages are static; the subscribe and contact
forms and a few proxy routes run on the server.

This is a mirror of my private repo.

## Run it

```sh
bun install
bun run dev
```

`bun run check` type-checks. `bun run test` runs a production build and checks that every
entry ends up in it.

Entries live in `src/entries/<slug>/index.md` or `index.mdx`, next to their poster image.

## Configuration

Every variable is optional. Leave one out and its feature does nothing.

| Variable | Read | What it does |
| --- | --- | --- |
| `UMAMI_WEBSITE_ID` | at build | Adds the Umami analytics script |
| `UMAMI_URL` | at runtime | Umami origin, proxied at `/u/script.js` and `/u/api/send` |
| `LNURL_URL` | at runtime | Lightning Address server behind `/.well-known/lnurlp/` |
| `LISTMONK_URL`, `LISTMONK_LIST_ID`, `LISTMONK_API_USER`, `LISTMONK_API_TOKEN` | at runtime | Adds subscribers to a Listmonk list |
| `NTFY_URL`, `NTFY_TOPIC`, `NTFY_TOKEN` | at runtime | Sends a push for each new subscriber or contact message |

Without the Listmonk variables the subscribe form still renders, but tells the reader nothing
was sent. [ADR 0003](docs/adr/0003-subscriptions.md) explains why.

## Licence

The code is MIT. The prose in `src/entries` is CC BY 4.0, and code snippets in it are CC0. The
poster images aren't covered. See [`LICENSE`](LICENSE) and
[`src/entries/LICENSE`](src/entries/LICENSE).
