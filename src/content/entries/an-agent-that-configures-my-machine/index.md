---
title: An agent that configures my machine without touching it
date: 2026-09-18
summary: I set up the same Linux desktop by hand twice in a few months, refused to do it a third time, and then had an agent write the configuration from a container that has never seen the machine.
topic: Agents / NixOS
poster:
  src: ./poster.jpg
  alt: A black ThinkPad open on a dark wooden desk, its screen filled with amber terminal text. Behind it, out of focus in the dark, a rack unit with green indicator lights.
stats:
  - 1 flake · 3 profiles
  - T460s · NixOS + niri
notes:
  - Nothing graphical can be tested from a container, so the niri and noctalia parts of this configuration were reviewed by eye and applied by hand.
draft: false
---

I moved off macOS recently and put Fedora on a laptop, configured by hand, the way everyone
does it the first time. Then that laptop turned out to be broken. I sent it back, got the
money, and fell back to an old ThinkPad that had been sitting in a drawer.

The second install went faster, because I had dotfiles. My shell, my editor and my
configuration files landed in the right places within a few minutes of a fresh system.

Then I spent the rest of the day on everything else. Dotfiles stop at `$HOME`. Every change I
had made below that line, the packages, the services, the mounts, the things I had fixed once
and forgotten, was not written down anywhere except on a laptop I had already posted back.
So I did it again from memory, badly, over an afternoon.

Sitting there, I worked out roughly how long it would take me to do it a third time, and
decided I was not going to. Not because a third machine was likely, but because I had just
learned that the part of my computer I actually cared about was the part I had never bothered
to record.

That is why everything is declared now. What I did not expect is that I would end up writing
almost none of it.

## Two machines

The laptop is that ThinkPad, a T460s, now running NixOS with niri and noctalia.

The agent has never logged into it. It runs in a dev container on a different box, in a clone
of the repository the laptop is built from. The container is for editing, not the target.

There is nothing to enforce there. The container holds no credential for the laptop and has no
route to it. Handed a change to my window manager, the only thing it can do is commit it.

That is the arrangement the whole repository was written under. I made the decision to go
declarative and then, instead of learning Nix a module at a time over a month, I had the agent
write the configuration and I read what came back. The disk layout, the window manager, the
shell, the module that installs the command I use to apply any of it: all of it arrived as
diffs from a container that has never seen this laptop.

## One repository, three profiles

If you have not met these: a Nix flake is a definition of a system with its inputs pinned, so
the same definition produces the same result later. Home-manager owns the `$HOME` half, the
dotfiles and user packages, and it will run on its own on a distribution that is not NixOS.
The system half is NixOS itself, which is the part my Fedora dotfiles could never have carried.

Three home profiles, one system:

```nix
homeConfigurations = {
  "pycan@t460s"    = ...;  # the laptop
  "root@deb-agent" = ...;  # the LXC that runs the dev containers
  container        = ...;  # any dev container: its hostname is a random id
};

nixosConfigurations.t460s = ...;
```

Home-manager runs standalone on the second and third, so Debian stays Debian. There is one
container profile rather than one per container, because a container's hostname is an id
nobody chose and there is nothing there worth keying on.

So the shell I get on the laptop is the shell I get over SSH on the LXC and the shell the
agent gets inside a container, because one file builds all three.

## Why an agent is safe to point at this

Its output is a diff.

It edits Nix files in a clone, commits, and pushes a branch to my own Forgejo. Nothing it
wrote is running anywhere.

Which is why I run it with permissions off and no prompts at all. A permission prompt asks
whether to let the agent do something. Here there is nothing being done, only a file being
written in a container with nowhere to reach, so approving or refusing would be theatre. The
review happens once, on the diff, when I am ready to read it.

Applying is a separate act and it is mine. One command, `dots`, which is a three-line script
the repository installs into itself:

```bash
git -C "$dotfiles" switch main
git -C "$dotfiles" pull --rebase --autostash
sudo nixos-rebuild switch --flake "$dotfiles#t460s"
```

On the laptop that last line is a `nixos-rebuild`; on the LXC the same command is a
`home-manager switch`, because that host has no system half to rebuild. If the result is wrong
the previous generation is still in the boot menu, which I have not yet needed and am glad to
have.

## It tests its own environment

An agent that can only guess whether its change works has written you a suggestion.

The container profile is the environment the agent is standing in, so it applies its change to
itself:

```bash
./install.sh container   # and again: it has to be idempotent
zsh -ic exit             # has to be silent
```

Break the shell and it is the agent's own shell that breaks, immediately, in a container that
costs nothing to throw away.

The system half is checked without a NixOS machine anywhere:

```bash
nix eval .#nixosConfigurations.t460s.config.system.build.toplevel.drvPath
```

That evaluates the whole configuration of a machine the container has never seen. A malformed
module, an option that does not exist, a package renamed upstream: all of it fails there, on
Debian, in a container, some minutes before I would have found out by rebooting into it.

## What it cannot test

The graphical half. There is no Wayland session in a dev container, so niri cannot run, and
everything downstream of niri is reasoning rather than evidence.

My best example is a dictation tool called handy, which recorded, transcribed, and then pasted
nothing at all. The chain: niri strips `DISPLAY` from what it spawns when no X server is
running, handy's input library then fails to construct, and handy 0.9.1 reads that handle
before it dispatches, so every paste died on `Enigo state not initialized` and never reached
the `wtype` it would otherwise have used. The fix is an `xwayland-satellite` that exists for
handy alone and for no X11 app at all. Upstream moved that read in a later release, so this
stops being necessary whenever nixpkgs catches up.

An agent is good at that. Reading the issue tracker, finding the commit that moved the read,
writing the module: all of it is work it can do from a container. Watching the paste land is
not, so I do that bit.

## What the shape buys

The dev containers are long running and they are not on my laptop.

I have several projects open on that box at once, a container each, and I keep them in herdr,
a multiplexer whose sidebar tracks which agent is in which pane and what state it is in.
Several agents working at the same time, on different repositories, none of them able to
reach another's files.

I close the lid whenever. Nothing stops. I ssh back in, attach to herdr, and it is all where I
left it, including whatever ran while the laptop was shut. I have read the tail of a long run
on a phone, on a train, which is not a way to work but does beat the run not having happened.

The ThinkPad was supposed to be a stopgap until I bought something better. It compiles
nothing and stays quiet, and because the work happens on the other machine it has become the
laptop I use. A faster one would not make anything I do faster.

## What it costs

The box in the cupboard is a dependency of my working day now. My power and my uplink sit in
the path of everything, which they did not when the work happened in front of me.

A long-running container is a pet. It drifts from its definition quietly, and you find out
what you had been leaning on the day you rebuild it.

Nix is a large thing to ask of anyone: most of what is good here follows from the machine
being declarative rather than from Nix in particular, but Nix is what I use and the ramp is
not gentle.

Secrets want care instead of convenience. The one credential a container gets is a token for
my own Forgejo, so the agent can push a branch, and it arrives by my answering a prompt when
the container is created. One token per container, and never inside a remote URL, because that
writes it into `.git/config` where a push can carry it back out. My wifi key lives in a mode
600 file outside the repository, because NixOS renders profile definitions into the store and
the store is world readable.

And there are traps peculiar to this. A flake reads tracked files alone, so a new module wants
`git add` before a switch or it may as well not exist. Home-manager refuses to write over a
file already sitting at the path it wants, which is correct, and is the error I see most.
Anything an application rewrites for itself cannot live in the read-only store, so it gets a
symlink back out to the clone, and then that application's ordinary use dirties the repository.

## Whether it holds

The T460s is the first machine I put NixOS on, and I will replace it eventually. That install
is the test of all of this. A disk, a flake, one command, and then I find out whether I have
kept the repository honest since the last time I touched it.

What I did not plan was the agent part. It fell out of a decision I made because I could not
face another afternoon of remembering what I had done to a computer that no longer existed.
