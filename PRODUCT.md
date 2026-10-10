# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Working engineers first: developers and sysadmins who self-host or want to, reading to understand or copy a setup. The page must stay readable to technically literate people who rent everything today and are weighing whether to leave.

## Product Purpose

Jakub's personal blog. It argues that software you depend on should be software you can inspect, move, and turn off, through entries on self-hosting, homelab and networking, Linux, agent tooling, and quality-of-life config, plus a Built page of things he has made.

Success is reputation: the site stands as proof of Jakub's craft. Reads, subscriptions and reuse matter less than what the site says about the person who made it.

## Positioning

The site practises what it argues, and the claim is checkable: a reader can open devtools and see no request leave this origin (ADR-0001). It runs on Jakub's own hardware and a rented VPS. A blog on a hosted platform could not say this truthfully.

## Operating Context

Read on desktop and phone, often from a link in a feed, chat or search. Entries are long, technical, and carry code, diagrams and sometimes a YouTube video behind a self-hosted poster. Readers can follow by feed or confirmed mail subscription (ADR-0003), or write through the contact form.

## Capabilities and Constraints

- Vocabulary is fixed in `CONTEXT.md`: entry, article, video, poster, topic, blog, Built, masthead, statement, subscription, dependency budget. Use those words.
- Dependency budget (ADR-0001): no third-party request at page load. Fonts self-hosted as subsetted woff2; no webfont CDN, embeds, share buttons or hosted scripts without revisiting the ADR.
- Images such as Built screenshots and posters are committed, not fetched at build.
- URLs never end in a slash; prose is CC BY 4.0, code CC0/MIT (ADR-0002).
- Astro static pages prerendered into a small Node server, for the analytics proxy and forms.

## Brand Commitments

- Name: Unbeholden. Author: Jakub, writing in first person.
- Voice: plain, direct, dry; British English; no em-dashes; no marketing tone.
- Front page statement: "A shelf of hardware, a rented VPS, and no third parties in between."

## Evidence on Hand

- Three entries in `src/entries/`: Stalwart email, Bitcoin and Lightning node, an agent that configures a machine.
- Built: Skorpik and this site, with screenshots in `src/assets/built/`.
- No testimonials, reader counts, press or client names. Do not invent any.

## Product Principles

1. Practise the argument. Anything the site does must survive a reader checking it.
2. The writing is the product; design serves reading long technical prose.
3. Craft shows in restraint and detail, not in decoration.
4. Fewer moving parts. A feature that adds a dependency has to earn it.

## Accessibility & Inclusion

WCAG 2.2 AA is the floor.
