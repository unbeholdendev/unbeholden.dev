---
title: Booking calls with calrs
date: 2026-11-06
summary: The booking page runs on calrs, a self-hosted scheduler that reads a CalDAV calendar. One Rust binary and a SQLite file.
topic: Self-hosting
poster:
  src: ./poster.jpg
  alt: A printed year calendar close up, with May in the middle and Sundays in red, half in shadow.
---

If you want to talk to me, there's a link:
[cal.unbeholden.dev/u/jakub/lets-chat](https://cal.unbeholden.dev/u/jakub/lets-chat). You pick a
free half hour, book a video call, and it turns up in my calendar. The page runs on
[calrs](https://cal.rs), self-hosted.

## What calrs is

calrs is an open-source scheduler, AGPL-licensed and written in Rust. It's one binary that
serves HTTP and keeps everything in a single SQLite file, shipped as a Docker image. There's no
Node.js or Postgres to run alongside it.

It connects to any CalDAV server: Nextcloud, Fastmail, iCloud, Radicale and others. Google
Calendar isn't one of them, because Google only allows CalDAV over OAuth. calrs reads the
calendar to work out when I'm busy, offers the free slots within the hours I've set, and writes
confirmed bookings back to it. Recurring events are expanded, so a weekly meeting blocks
every week and not just the first.

## Why not a hosted one

I looked at a hosted service first, something like Cal.com. It would have been quicker, but it
goes against what this site argues for. A booking link is something you hand out and expect to
keep working. On a hosted service, the URL, access to the calendar and the record of who booked
what would sit with someone else.

I'd been here before, too. On another project, a hosted scheduler meant changing the privacy
policy, because it sent the details of everyone who booked to a third party, which nobody had
intended.

Self-hosted, the link stays on unbeholden.dev and the bookings stay in a SQLite file on the server.

## Running it

calrs runs on Giran, the VPS that serves this site, as a Dokploy app. The container needs a
persistent volume at `/var/lib/calrs` for the SQLite database, and `CALRS_BASE_URL` set to the
public URL so the links it sends out point at the right place.

The calendars are in Radicale, on [Aden at home](/blog/getting-my-homelab-into-git), and calrs
reaches them over the tailnet. Everyone in the family has their own calendar, and calrs checks all
of them. When someone in the family is busy, I usually am too: I'm taking the kids to the doctor,
or looking after them while my wife is out.

Confirmations and reminders go out by email through the [Stalwart](/blog/self-hosting-email-with-stalwart) mail server.

Once it's up, you sign in, connect a calendar, set your hours and create an event type. Mine is
"Let's chat", 30 minutes, video call. The video link is a Whereby room for now, which I plan to
replace.

The booking page is plain: a month view, a time zone picker, a 12/24-hour toggle, and the free
slots.
