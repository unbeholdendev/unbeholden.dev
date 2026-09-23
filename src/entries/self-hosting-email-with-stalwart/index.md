---
title: 'Owning your email: self-hosting with Stalwart in 2026'
date: 2026-09-20
summary: Everyone says not to self-host email. I ran a mail server anyway, found most of the received wisdom either outdated or solvable.
topic: Self-hosting / Email
poster:
  src: ./poster.jpg
  alt: A worn brass letterbox set into a dark painted door, lit warm from one side, with an indigo light glowing from the gap behind the flap.
---

Everyone tells you not to self-host email. Deliverability is impossible, the big providers will bin everything you send, you will spend
your weekends fighting spam filters. I ran a mail server anyway. It took one long day, most of
the received wisdom turned out to be either outdated or solvable, and I now run email for
multiple domains and family members on a small VPS.

This post is about why, what it actually costs, and the three sharp edges I ran into.

## Why bother

The usual arguments for self-hosting email are weak. Limited inbox size, no custom domains,
ads in your mail client: all of that is solved by paying Fastmail or Migadu a few euro a
month. If that were the whole case, I wouldn't have done this.

The real argument is that email is the root of your digital identity. Every password reset,
every account recovery, every "verify your identity" flow terminates in your inbox. If you
rent that inbox, someone else holds the master key to everything you do online, and they can
revoke it. Not out of malice, usually. An automated system flags your account, an appeal form
goes nowhere, and suddenly you are locked out of your bank, your registrar, your government
portal, all at once. People this has happened to write about it with a specific kind of shell
shock. The probability is low. The blast radius is total.

There is also the quieter issue that the dominant free providers read your mail as a business
model, and the practical one that no provider at any price gives you what a server of your own
does: unlimited domains, unlimited addresses, a catch-all per domain so you can invent a fresh
address for every service on the spot, and calendar, contacts and file sync thrown in.

## What it costs, honestly

Before any config files, the ledger. Self-hosting email costs you:

**An outbound relay, and the metadata that goes with it.** I send through SMTP2Go rather than
directly from my VPS. This is the one real compromise in the setup, so let me defend it
properly. Outbound deliverability on port 25 is a reputation game measured in years and rigged
toward incumbents; a fresh VPS IP starts somewhere between suspicious and blocked. A relay
buys you out of that war for free (their tier covers personal volume) at the price of one
company seeing your outbound metadata: who you write to, how often. Inbound mail, which is
most mail, never touches them. And the arrangement is reversible: direct sending is a config
change, not a rebuild, if I ever decide the IP warming game is worth playing.

**Being your own ops team.** Backups, updates, and the possibility that something breaks while
you are on a mountain somewhere. Softened considerably by the fact that sending servers retry
for days, so a down mail server loses nothing, it just delays.

**One long day.** Mine took about fourteen hours, most of it spent discovering the three
pitfalls below. With this post in hand, I would estimate two.

## The architecture

Five components, each doing one job:

- **A VPS** with a provider that allows mail traffic, with the provider-level firewall as the
  hard outer boundary.
- **Stalwart**, a modern all-in-one mail server written in Rust: SMTP, IMAP, JMAP, spam
  filtering, web admin, CalDAV/CardDAV, all in one binary. After this experience I would not
  consider the traditional Postfix/Dovecot/Rspamd assembly for a personal server.
- **Dokploy with Traefik** already running on the box, owning ports 80/443 and terminating TLS
  for the web side (admin UI, client autodiscovery).
- **SMTP2Go** as the outbound relay, wired in as an MTA route inside Stalwart.
- **DNS automation**: Stalwart holds an API token for my registrar and manages each mail
  domain's records itself, including the DKIM keys and the TXT challenges for its own TLS
  certificates.

The decision that matters most: **mail ports bypass the proxy entirely**. Ports 25, 465, 587
and 993 are published straight from the container to the host, while only HTTP goes through
Traefik. This is not laziness. SPF checks, rate limiting and IP banning all need to see the
real IP of whoever is connecting, and a proxy erases that. This single choice prevents an
entire category of problems, and causes exactly one, which we will get to.

The firewall, at the provider level, is just four inbound rules:

```
TCP 25   from anywhere   (SMTP, other servers delivering to you)
TCP 465  from anywhere   (submission, implicit TLS)
TCP 587  from anywhere   (submission, STARTTLS)
TCP 993  from anywhere   (IMAPS)
```

TLS ends up split in two, and this confused me initially: Traefik gets certificates for
the web hostnames the normal way, and Stalwart gets its own certificate for the mail ports via
the DNS-01 challenge, writing the validation record through the registrar API. Two
independent, self-renewing chains, neither needing manual attention again.

Everything else is pleasantly boring. You create one account for yourself, attach as many
addresses across as many domains as you like, switch on a catch-all per domain, and every
client from Thunderbird to a phone autodetects the settings from the DNS records Stalwart
published. Adding email domain number two is: one Domain object, one registrar API token if it
lives elsewhere, one SPF edit, done.

## The three sharp edges

This is the section I wish had existed last week. Each of these cost me hours.

### 1. Your proxy will ban itself

Stalwart ships with automatic IP banning, and it is good: brute-force an account or scan ports
and your IP gets dropped at the socket. But every HTTP request arriving through a reverse
proxy carries the proxy's internal IP, so the proxy accumulates the whole internet's sins and
eventually gets banned for them. When that happens, everything behind it dies at once: admin
UI, autodiscovery, all of it. The docs warn about exactly this, in a paragraph I read only
after living it. Worse, in my case the ban state outlived deleting the blocked IP entry, and
the only thing that worked was moving the proxy to a different internal address.

The rule underneath: IP-keyed security must run where real IPs are visible. Mail ports,
published directly, ban real attackers correctly. The HTTP path has no usable source IPs, so
exempt it: add your Docker subnets to Stalwart's allowed IP list on day one, before anything
forces you to learn why.

### 2. Two ACME clients cannot share port 80

Traefik gets its certificates via the HTTP challenge, which means it owns
`/.well-known/acme-challenge/` on the entire entrypoint. When Stalwart later tried to get its
own certificate the same way, Traefik intercepted the validation requests and returned 404 for
tokens it didn't recognise. Traefik's log even says so, politely: `Cannot retrieve the ACME
challenge for mail.unbeholden.dev`. Stalwart's certificates must therefore use the DNS-01
challenge, which touches no ports at all.

Related trap: Stalwart publishes CAA records pinned to its own ACME account, which silently
blocks *Traefik* from issuing anything for that domain until you loosen the record and tell
Stalwart to stop republishing it. Two certificate clients on one box means their authorisation
worlds collide in both directions.

### 3. Declared networking beats dynamic networking

Dokploy connects its Traefik to your app's Docker network dynamically when you add a domain.
This works until a Traefik restart drops the connection, at which point you get Bad Gateway
with a perfectly healthy container and nothing in any log. The fix is one block in the compose
file, straight from Dokploy's own documentation, attaching the service to the shared
`dokploy-network` explicitly. Every Dokploy compose app with a domain needs it. Runtime state
that nothing declares is state you will one day debug at midnight.

## What you get

At the end: my own mail server, scoring 10/10 on mail-tester on its first graded run. SPF,
DKIM and DMARC all pass and align. Unlimited addresses across unlimited domains, a catch-all
so every service gets its own disposable address, server-side filtering, and, unexpectedly,
calendar, contacts and file sync over CalDAV/CardDAV/WebDAV that my clients picked up during
the same autodiscovery pass. Total running cost: a VPS I already had, a domain, and zero
subscriptions.

And the thing that is harder to screenshot: the root of my digital identity now runs on
hardware I control, from a config file I can read, with no account manager anywhere who can
switch it off.

## Should you?

If you have never run a server, no. Start with something whose failure costs you nothing.

If you already operate your own infrastructure, patch your own boxes, and the identity-root
argument resonates, then the honest answer is that self-hosted email in 2026 is much more
tractable than its reputation. Stalwart collapsed the historically awful part (integrating
five daemons) into one coherent system, the relay collapses the deliverability war into one
acceptable compromise, and the remaining difficulty is exactly the three patterns above, which
you now know in advance.

The advice not to self-host email was written about a different decade's software. The blast
radius argument for doing it was not.
