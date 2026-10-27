---
title: How much of your website is rented?
date: 2026-10-16
summary: I built Unbeholden Check as a small weekend project. Type a domain and it lists the services the site rents from other companies, shows the evidence for each, and names open source software that could take its place.
topic: Self-hosting
poster:
  src: ./poster.jpg
  alt: Rows of server racks with glowing green lights stand in the open at night, cables slung between them, and city towers rise at the far end.
---

Most of what I write here is about moving things I depend on off services I rent and onto
software I run. Mail went to [Stalwart](/blog/self-hosting-email-with-stalwart), and payments go
through [my own Lightning node](/blog/running-my-own-bitcoin-and-lightning-node). What I didn't
have was a quick way to see how much of a website is still rented, mine or anyone else's.

So I built [Unbeholden Check](https://check.unbeholden.dev) as a small weekend project. You type a domain, without signing
up, and it marks every third party it finds as owned or rented, shows the evidence, and names
open source software that could replace each rented piece.

## What a result looks like

This site scores 50 out of 100. Check scored four things:

- SMTP2Go, rented. The SPF record includes `spf.smtp2go.com`. That's the relay I send mail
  through, and Check suggests docker-mailserver, Stalwart or Mailcow in its place.
- Spaceship DNS, rented. The nameservers are Spaceship's. The suggestions are CoreDNS,
  Technitium DNS and PowerDNS.
- My own mail server, owned. The MX record points at `mail.unbeholden.dev`.
- My own server, owned. The IP is in netcup's network, and the software on it is open source.

The VPS is rented hardware, so calling it owned looks odd. Check scores the software: a server
running open source counts as owned, and a service that a company runs for the site counts as
rented.

It also found six things it lists but doesn't score: Astro, the RSS feed, Open Graph tags, HSTS,
HTTP/3 and a Google site verification record.

For contrast, [stripe.com](https://check.unbeholden.dev/stripe.com) scores 33. Its DNS is on
Amazon Route 53, its mail is on Google Workspace, and it sends through Mandrill, SendGrid and
Qualtrics. It also has domain verification records for eight other companies, such as Atlassian and
DocuSign, which Check lists as accounts and leaves out of the score.

## How the score works

The score is the weighted share of scored services that run on open source. Mail, DNS and
hosting count three times. CDN, auth, payments, forms, CRM and CMS count twice. Everything else
counts once, and when a site uses several providers in one category they share its weight.
Libraries and frameworks are listed but don't count.

If Check can't find enough to score, it shows "not enough data" in place of a number.

## The alternatives

Each rented tool gets up to three open source alternatives. I picked them by hand, and each one
has to have an OSI licence, a release in the last 12 months, and a repository that isn't
archived. Next to each is its licence, GitHub stars, latest release, and a way to self-host it or
pay someone to run it for you. Where I've written about one, like Stalwart, there's a link to the
entry.

It knows 103 rented tools and 63 open source projects that can replace them. When I haven't found
anything I'd vouch for, the result says so and names nothing.

## What it can't see

Check reads DNS and makes one plain fetch of the homepage. It doesn't run JavaScript, so a tool
that a script loads after the page arrives may not show up, and every result page says this.

It's passive on purpose. I'd rather miss a tool than claim one that isn't there, and every finding
comes with the record, header or bit of HTML it's based on, so you can check it yourself.

Results are cached for a day, and you can rescan a domain once an hour.

Check doesn't look at where a company is, and it doesn't sell anything.

## Using it

Go to [check.unbeholden.dev](https://check.unbeholden.dev) and type a domain. Each result has its
own page at `check.unbeholden.dev/<domain>`, so you can share it.

You can leave your email on a result to hear when its score changes. Nothing gets sent yet, and
the first email will ask you to confirm. To have a result page taken down, email
removal@unbeholden.dev.
