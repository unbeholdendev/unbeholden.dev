---
title: A Bitcoin wallet in a browser tab
date: 2026-10-22
summary: I'm building Unbeholden Wallet, a watch-only Bitcoin wallet that runs in a browser tab. There's nothing to install, it connects to a node of your choosing, and it never holds a key.
topic: Self-hosting
poster:
  src: ./poster.jpg
  alt: Gold-coloured Bitcoin tokens resting on a black wallet, with payment cards underneath.
draft: true
---

I was selling some bitcoin in person, on a new Linux laptop. I opened Sparrow to send the
coins, and it couldn't open the camera because a system library was missing. I had no quick
alternative to finish the deal.

A wallet in a browser tab would have done it. So I'm building one:
[Unbeholden Wallet](https://wallet.unbeholden.dev). It's a watch-only Bitcoin wallet that runs in
a browser, on a phone or a computer, with nothing to install. You choose which node it connects
to, and it never holds a key.

It's on-chain only for now. Lightning may come later, and so might other things, but I'll see
how it goes.

## Why not Sparrow

Sparrow is great, and it's what I used. But it only runs on a desktop, and every machine I want it
on needs it installed. Most of what I do with a wallet is read-only: check a
balance, look through history, see which coins I hold. None of that should need software
installed on the machine in front of me.

The wallets that run anywhere tend to be custodial, or tied to a company's server that sees every
address you look up, or unable to talk to my own node. I already run
[Bitcoin Core and Fulcrum at home](/blog/running-my-own-bitcoin-and-lightning-node), so I wanted
a wallet that uses that and nothing else.

If you have to leave your country or lose access to your computer, you may still have your
hardware wallet. A browser wallet lets you check your balance or send a payment from a borrowed
phone or laptop. If you can't reach your own node, you can use a browser-compatible public
Electrum server, though its operator can see the addresses you look up.

## What it does

You give it a descriptor or an xpub from your signer. It works out your addresses, syncs from your
chosen Electrum server or Esplora API, and shows your balance, history, addresses and coins. It
handles single-signature `wpkh` and `tr` wallets, and `wsh` multisig, on mainnet, signet and
regtest.

To send, it builds a PSBT and shows it as an animated QR code. You hold the screen up to an
air-gapped signer such as a SeedSigner, it signs, and you scan the signed transaction back with
the camera. A file works too. Then the wallet broadcasts it through your chosen server.

The send screen starts from your coins. As you pick them it shows the fee and the change, and
which coins you'd be linking together on-chain that weren't linked before. In the wallets I know,
coin selection is behind an advanced toggle, and none of them tell you that.

Some other things I wanted:

- labels in BIP329, so they move in and out of other wallets
- fee suggestions from your chosen node's mempool, and fee bumps when a payment gets stuck
- amounts in BTC or sats, and no fiat anywhere
- an encrypted vault in the browser, unlocked with a password

There's no default server. Until you enter yours, it does nothing. If your Electrum server only
speaks TCP, as [electrs](https://github.com/romanz/electrs) does, the container below has a bridge for it.

## Why it can't spend your coins

The wallet never sees a private key. The worst a bug or a tampered copy can do is show you the
wrong thing or build the wrong transaction, and your signer still shows you the addresses and
amounts before you approve. That's a much smaller risk than a wallet that can spend on its own,
and it's the reason I was willing to put a wallet on a web page at all.

## What a hosted copy can't protect you from

There's a copy anyone can open at [app.wallet.unbeholden.dev](https://app.wallet.unbeholden.dev).
It's for a phone, or a borrowed laptop in an emergency. On a computer that isn't yours, delete the
vault in Settings when you're done.

Whoever controls the domain could serve you different code, for example to show you a receive
address that isn't yours. Nothing in a web page can rule that out.

After the first load a service worker pins the code, so a new version only runs when you choose
to reload into it. It makes no requests to anyone but your chosen server, with no analytics,
CDN or remote fonts, and a Content Security Policy blocks other kinds of request. Builds are
reproducible, and each release publishes the hashes of its files, so you can check that a copy
matches the source.

For regular use, run your own copy. It's one container:

```sh
curl -O https://raw.githubusercontent.com/unbeholdendev/unbeholden-wallet/main/compose.yaml
docker compose up -d
```

That serves it on `http://localhost:8080`. To open it on your phone, put https in front of it,
with Tailscale or Caddy for example. The
[self-hosting guide](https://wallet.unbeholden.dev/self-hosting.html) has the details, including
how to give your node a certificate the browser will accept.

## How it was built

AI wrote the code, under my direction. Agents work on it in containers, open pull requests on my
own Forgejo, and [a reviewer bot](/blog/a-reviewer-for-my-agents) goes through each one
before I do. I decide what it does and review the work. Writing it by hand would have taken far
longer, but you should know how it was made before you trust it with your data.

## Trying it

The [demo](https://demo.wallet.unbeholden.dev) is the real app on a wallet with made-up history.
It talks to no server, so you don't need a node to try it. When you're ready to use your own
coins, open the wallet and point it at a node of your choosing, or run it yourself.
