---
title: Self-hosting email in 2026, the honest version
date: 2026-08-14
updated: 2026-09-01
summary: Running your own mail server is neither impossible nor free. Here is what it actually costs, and the two things that will break.
topic: Self-hosting / Mail
poster:
  src: ./placeholder-poster.png
  alt: A rack-mounted mail server
video:
  id: dQw4w9WgXcQ
  duration: '18:42'
stats:
  - $11/mo · 2h setup
  - 3 domains · 40k messages
notes:
  - Deliverability figures are from a single sending domain over six months, so treat them as an anecdote rather than a benchmark.
  - The zone omits DNSSEC, which is worth adding but is a separate job.
draft: true
---

Most guides to self-hosting mail are written by people who set it up last week. This one is
written after three years, which is long enough for the interesting failures.

## What it costs

A small VPS with a clean IP and a PTR record you control. That is the whole shopping list,
and the second half is the part that people skip.

- A VPS with reverse DNS you can set
- A domain with somewhere sane to edit the zone
- Roughly two hours, once

## The zone

```ini
example.com.        3600 IN MX  10 mail.example.com.
mail.example.com.   3600 IN A   203.0.113.10
example.com.        3600 IN TXT "v=spf1 mx -all"
_dmarc.example.com. 3600 IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@example.com"
```

The `-all` is deliberate. A soft fail tells receiving servers that you are not confident,
and they will believe you.

## Checking it

```bash
#!/usr/bin/env bash
# Fail loudly if the PTR stops matching the banner.
set -euo pipefail

host=$(hostname -f)
ptr=$(dig +short -x "$(dig +short "$host")" | sed 's/\.$//')

if [[ "$ptr" != "$host" ]]; then
  echo "PTR is $ptr, expected $host" >&2
  exit 1
fi
```

Run it from cron. The failure mode is silent: mail keeps sending, and a slowly growing
share of it lands in spam.

## What will break

> Two things, and neither is the software.

The first is your IP's reputation, which you inherit rather than earn. The second is a
provider deciding, without notice, that port 25 is now a paid feature.

## Whether to do it

If the answer has to be yes for everyone, no. If it can be yes for you, then yes.
