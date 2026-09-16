# Zero third-party requests at page load

A site arguing that you should be able to leave what you depend on cannot hand its readers
to Google before the first paragraph renders, so pages make no third-party network requests
on load: typefaces are self-hosted as subsetted woff2 rather than linked from Google Fonts,
and a film is represented by its self-hosted poster with the YouTube iframe injected only on
click. Analytics is self-hosted, cookieless, and served from this origin: the tracker and
its collect endpoint are proxied under `/u/`, so the browser never learns that Umami runs
anywhere else. A subdomain would have satisfied the letter of this and not the spirit,
since `stats.unbeholden.dev` is still a second origin and a second DNS lookup.

The point is that the claim is checkable: a reader can open devtools and confirm the network
tab holds nothing but our own origin.

## Considered options

A raw `youtube.com/embed` iframe was rejected because it pulls 600KB–1.3MB of player
JavaScript and sets identifiers whether or not the reader ever presses play, which on a
UK/EU-facing site turns into a consent obligation and a cookie banner.
`youtube-nocookie.com` was rejected as a solution on its own: it defers some storage but
still makes the request and still discloses IP and referrer. It remains the origin the
iframe loads *from* once a reader clicks.

Self-hosting video was rejected: encoding and bandwidth cost real money and it forfeits the
only thing YouTube is good for, which is being where an audience already is.

## Consequences

Poster images are downloaded and committed rather than hotlinked from `i.ytimg.com`, and a
film's duration is typed into frontmatter by hand, so the build has no dependency on a
Google API. Anything that would add a runtime dependency — an embedded comment system, share
buttons, a hosted analytics script, a webfont CDN — is out of scope by default and needs this
ADR revisited rather than a pull request.

The proxy is the one thing on the site that must run rather than be served, so the build now
emits a Node server and every page is prerendered into it. Two variables configure it, and
they are read at different times. `UMAMI_WEBSITE_ID` is public and rendered into the page, so
the builder holds it and it is frozen into every prerendered file. `UMAMI_URL`, the origin to
forward to, written without a trailing slash, is read from `process.env` by the proxy while it
runs, and deliberately not through `import.meta.env`, which Vite would compile to a literal in
the bundle and carry into the image. Leave the ID unset and no script tag is emitted; leave the
URL unset and the tag is emitted and `/u/` answers 404, which the network tab shows.

This moves the deployment target. `dist/` is no longer a web root: the static files are in
`dist/client/` and the site is started with `bun run dist/server/entry.mjs`. The site is reached
through Pangolin, so the box publishes no port of its own and the Newt tunnel is the only
route in; bind the server to whatever address Newt can reach rather than to loopback by
reflex, since the two differ when Newt runs in a container.

Request headers pass through to Umami, `X-Forwarded-For` among them, which is what lets Umami
hash a session per reader instead of reading the whole site as one visitor. The address is
therefore only as honest as Pangolin's Traefik, which drops an inbound `X-Forwarded-For` and
writes its own from the connecting address — unless `forwardedHeaders.trustedIPs` on the
entrypoint is set wide enough to trust readers, which would let one choose their own session
and country.

Three things would undo the disguise, and none of them is visible from this repo. Setting
`COLLECT_API_HOST` on the Umami build bakes an absolute origin into the tracker, which then
posts straight past the proxy. So does a `data-host-url` attribute on the script tag. And the
proxy forwards exactly two paths, because a catch-all would publish Umami's login route on
this domain.
