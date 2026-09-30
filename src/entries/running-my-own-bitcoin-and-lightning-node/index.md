---
title: Paying without asking permission
date: 2026-09-30
summary: A bank decides whether your money moves. I run Bitcoin Core and LND at home and wrote my own Lightning Address server, so anyone can pay any address at this domain.
topic: Self-hosting / Bitcoin / Finance
poster:
  src: ./poster.jpg
  alt: An old wooden chest bound in worn brass, on dark stone, its lid lifted slightly and an open padlock hanging from the hasp, lit warm from one side, with indigo showing through the gap.
draft: true
---

Every payment you make through a bank is one the bank agreed to. It can hold a transfer for
review, close your account with a letter and no reason, or decide that your country, your job or
the person you're paying is too risky. It says yes most of the time, so you forget you were
asking. And [1.3 billion adults](https://www.worldbank.org/en/publication/globalfindex) never
get to ask, because nobody will open them an account.

I want to move my own money without asking anyone. Bitcoin can do that, but only if you run it
yourself. Leave your coins on an exchange, or use a wallet that talks to someone else's server,
and you've swapped one gatekeeper for another.

So I run my own: Bitcoin Core and LND on a box at home, and a Lightning Address server I wrote.
When I pay someone, it goes out over my own channels. When someone pays me, any address at this
domain works, `hello@unbeholden.dev` or anything else you like, and my phone buzzes when it
lands.

## Why bother

A while ago my bank stopped a larger payment I tried to make. It only went through once I'd
explained what the money was for. Nothing came of it, but I didn't like having to justify
spending my own money, and I'd rather not do it again.

Others have had it much worse. In 2022 Canada used emergency powers to have banks
[freeze the accounts](https://www.cbc.ca/news/politics/ottawa-protests-frozen-bank-accounts-1.6355396)
of people linked to the convoy protests, with no court order, and a court later ruled that
unlawful. In 2020 Nigeria's central bank
[froze the accounts](https://www.hrw.org/news/2020/11/13/nigeria-punitive-financial-moves-against-protesters)
of people who'd raised money for the #EndSARS protests against police brutality. Whatever you
think of the protests, in both cases someone other than the account holders decided their money
couldn't move.

With a full node I check every rule myself instead of trusting someone who says they did.
Lightning on top settles against that node, so no provider sees what I send or receive, and none
of them can stop serving my country next quarter.

## What it costs

**A terabyte and two days.** It's a full node without pruning. The container with Bitcoin Core,
LND and Fulcrum is about 1 TB, and the initial sync took two days.

**Capital, and some work to receive.** To receive over Lightning you need inbound capacity:
someone else's coins on their side of a channel with you. A new node has none. I opened a
channel, then swapped part of it out through [FixedFloat](https://ff.io), which moved those sats
to the other side and gave me room to receive.

**The node has to be up to get paid.** The recipient's node has to answer for a Lightning
payment to go through. If my box at home is down, the payment just fails, where an email would
be retried for days.

**Backups you can't get wrong.** Lose the seed and the channel backup and you lose whatever is
in your channels. LND's
[recovery guide](https://docs.lightning.engineering/lightning-network-tools/lnd/recovery-planning-for-failure)
covers both, and it's worth reading before you put money in.

## The setup

The pieces:

- An LXC at home running [Bitcoin Core](https://bitcoincore.org),
  [LND](https://github.com/lightningnetwork/lnd) and [Fulcrum](https://github.com/cculianu/Fulcrum),
  an Electrum server, so my wallets talk to my own node.
- [lnurl-server](https://git.unbeholden.dev/unbeholden/lnurl-server), about 1,300 lines of Go,
  next to LND. It answers Lightning Address lookups, asks LND for invoices, and posts to ntfy.
- My own [ntfy](https://ntfy.sh) server, for push notifications to my phone.
- Giran, the VPS that serves this site, joined to the home box over a tailnet run by my own
  [Headscale](https://github.com/juanfont/headscale).

Nothing at home is open to the internet. A wallet looking up `hello@unbeholden.dev` asks this
site for `/.well-known/lnurlp/hello`. The site passes that over the tailnet to the LNURL server,
along with the host that was asked for, so the invoice callback URL uses `unbeholden.dev`.
That's how the address lives on the root domain while the node sits on a home connection with no
ports forwarded.

How I set up Headscale, and why I didn't just forward a port, is the next entry.

## Why write my own LNURL server

I looked at existing ones first. Bending someone else's project into what I wanted looked more
tedious than writing it myself. It's one small Go server that does LNURL-pay, LNURL-withdraw and
ntfy notifications.

A Lightning Address is a thin layer over LNURL-pay. A wallet turns `name@domain` into
`GET /.well-known/lnurlp/name` and gets back a small JSON document with a callback URL and the
amounts it accepts. It calls the callback with an amount, the server asks LND for an invoice and
hands it back, and the wallet pays it.

A `*` entry in the config makes the server answer for any name. Named entries take priority, if
I want one with its own description or limits. It talks to LND with an
invoice-only macaroon, so it can create invoices but can't move funds or read my channels.

Since it's my own code, adding notifications was just two hooks:

1. When the callback creates an invoice, the server posts to ntfy with the address, the amount
   in sats, and the payer's comment if they left one. If a payment never arrives, I can see it
   got this far.
2. The server subscribes to LND's invoice stream and posts again when an invoice settles.

LNURL-withdraw is for tips. I can leave one in a restaurant as a QR code. The staff scan it,
claim the sats into their own wallet, and I get a notification when they do.

The code is public from today, MIT licensed, on my own Forgejo:
[unbeholden/lnurl-server](https://git.unbeholden.dev/unbeholden/lnurl-server).

## Where it ended up

Anyone can send sats to any address at `unbeholden.dev` from any Lightning wallet. The payment
lands in a channel on a node I run, checked against a copy of the chain I verified myself.
Payments I make go out over the same channels.

## Should you?

If you just want to hold some bitcoin, start smaller. A hardware wallet and your own full node
do that without the Lightning upkeep.

If you want to pay and be paid without asking anyone, and you already run a server that stays
up, it's very doable. It needs some capital for channels, and the LNURL part is smaller than it
looks.

[MiniBolt](https://github.com/minibolt-guide/minibolt) walks through the whole stack on an
ordinary PC, and [RaspiBolt](https://raspibolt.org) does the same on a Raspberry Pi. If you'd like a hand with yours, [get in touch](/about).
