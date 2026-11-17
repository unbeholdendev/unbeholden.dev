---
title: A declarative Bitcoin stack
date: 2026-11-17
summary: I'd set up Bitcoin Core, LND and Fulcrum by hand two or three times. Now the node is a NixOS VM built from bitcoinix, Unbeholden Wallet is a bitcoinix module, and unbeholden-lnurl is next.
topic: Self-hosting
poster:
  src: ./poster.png
  alt: The bitcoinix logo, a plus sign and the Unbeholden Wallet logo on a warm off-white background.
---

When I wrote about [running a Bitcoin and Lightning node](/blog/running-my-own-bitcoin-and-lightning-node),
it lived in a Debian container on Proxmox called Goddard. I'd set up every part of it by hand. I
installed Bitcoin Core, LND and Fulcrum, wrote their config files and systemd units, and fixed
things as they broke. It worked, but nothing outside the container said how it was built. The data
was backed up. The rest was in my head.

It was also the second or third time I'd done it. Each new machine meant building the same stack
from scratch: Bitcoin Core, then LND, then Fulcrum, with the same config files and the same
mistakes. I didn't want to do it a fourth time.

In the [homelab entry](/blog/getting-my-homelab-into-git) I said I want everything in Git, and
lately I've been making the rest of my setup declarative. The node was the obvious next step. It's now a NixOS VM, defined in [`infra`](https://github.com/unbeholdendev/infra), and
the whole node is one file,
[`nixos/goddard.nix`](https://github.com/unbeholdendev/infra/blob/main/nixos/goddard.nix). Build it
again and you get the same machine.

## bitcoinix

[bitcoinix](https://github.com/bitcoinix/bitcoinix) is a set of Nix packages and NixOS modules for
Bitcoin nodes. It's a community fork of [nix-bitcoin](https://github.com/fort-nix/nix-bitcoin),
which was archived in August 2026. Each service is a module. It runs as its own user, and
bitcoinix generates its secrets on the host instead of keeping them in Git.

Trimmed a little, the node is this:

```nix
services.bitcoind = {
  enable = true;
  dataDir = "/data/bitcoind";
};

services.lnd = {
  enable = true;
  dataDir = "/data/lnd";
};

services.fulcrum = {
  enable = true;
  dataDir = "/data/fulcrum";
};
```

The rest of the file is the machine around it: the disk layout, a static address, SSH keys, and
firewall rules. LND's gRPC port answers [BitBanana](https://bitbanana.app) on the phone, Fulcrum
answers the laptop, and bitcoind's RPC stays on the host.

[BTC RPC Explorer](https://github.com/janoside/btc-rpc-explorer) used to be the one thing outside the host that needed that RPC. It's gone.
Unbeholden Wallet now looks up any transaction, address or block height and broadcasts raw
transactions itself, all through Fulcrum.

## The move

Moving a Lightning node is the part you can't get wrong. LND must never run in two places, and an
old copy of its data must never start. Either one can broadcast an old channel state, and the peer
can then take the whole channel balance.

So nothing was copied. The container's volume, with the chain, Fulcrum's index and LND's data,
became the new VM's data disk. I stopped the services, made sure the container couldn't start
again, renamed the volume and attached it to the VM. Then I moved the directories to where
bitcoinix expects them, installed NixOS with
[nixos-anywhere](https://github.com/nix-community/nixos-anywhere) and fixed the file owners.

LND only starts if the migrated wallet is already there. Without that check, bitcoinix would create
a fresh wallet next to the old data.

Every change to LND's channel backup is now copied to TrueNAS, and a timer repeats the copy hourly
in case the NAS was down. The secrets bitcoinix generates stay on the host and get backed up
separately.

## Unbeholden Wallet

I also write apps that run next to the node, and I want them in the same file.
[Unbeholden Wallet](/blog/a-bitcoin-wallet-in-a-browser-tab) ran on Aden, as a Docker container.
Rather than write a module only for Goddard, I opened
[a pull request](https://github.com/bitcoinix/bitcoinix/pull/230) that adds it to bitcoinix, as a
package built from source and a NixOS module. The maintainers merged it and it shipped in [v0.1.6](https://github.com/bitcoinix/bitcoinix/releases/tag/v0.1.6),
so anyone running bitcoinix gets the wallet with one line:

```nix
services.unbeholden-wallet.enable = true;
```

The module serves the wallet and relays its connection to electrs, or to Fulcrum if you choose. It
listens on localhost, so you reach it through an SSH tunnel or an https reverse proxy. You'd want
one of those anyway, because browsers only allow the camera, which scans the signed transaction, on
localhost or over https. It also works with bitcoinix's network isolation and its onion service.

On Goddard it now runs next to Fulcrum, behind Traefik at home, and Aden has one container fewer.

## unbeholden-lnurl next

[unbeholden-lnurl](https://github.com/unbeholdendev/unbeholden-lnurl), the Lightning Address server
behind `hello@unbeholden.dev`, still runs on Aden. bitcoinix has no way to receive at
`you@yourdomain` with your own node unless you run BTCPay Server, with Postgres and NBXplorer, for
one endpoint. So I [asked](https://github.com/bitcoinix/bitcoinix/issues/256) whether the maintainers
would take a module for it, and they said yes.

It'll follow the wallet's pattern: off by default, listening on localhost, with an LND macaroon
that can only do what the enabled features need. The first version covers Lightning Addresses,
payment notifications and LNURL-withdraw vouchers, with the vouchers' secrets kept out of the Nix
store. Once the module is in, the whole stack will run on Goddard from one file.
