# Zero third-party requests at page load

A site arguing that you should be able to leave what you depend on cannot hand its readers
to Google before the first paragraph renders, so pages make no third-party network requests
on load: typefaces are self-hosted as subsetted woff2 rather than linked from Google Fonts,
and a film is represented by its self-hosted poster with the YouTube iframe injected only on
click. Analytics, when it arrives, is self-hosted and cookieless on our own subdomain.

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
