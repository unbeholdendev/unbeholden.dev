# A subscription form that posts to this origin and a list held in Listmonk

The site collects email addresses. The form posts to `/subscribe` on this origin, which
forwards to Listmonk on my own infrastructure, which sends the confirmation through
Stalwart. No third party is contacted, and no third party is contacted from the reader's
browser either, so ADR-0001 holds: the network tab on a page carrying the form shows this
origin and nothing else. A hosted form from Buttondown, Substack or Mailchimp was rejected
on that ground alone, before the question of who then holds the list.

Listmonk rather than SMTP alone, because a mail server sends mail and knows nothing about a
list. Confirmed opt-in with tokens, `List-Unsubscribe` and `List-Unsubscribe-Post` on every
send, bounce and complaint handling that suppresses an address without being asked, throttled
delivery, and a record of what went to whom are all things a list needs and an MTA does not
have. Writing them into this repo would have been the largest thing in it, and getting list
hygiene wrong on the domain that also carries my personal mail costs me the mailbox, not just
the newsletter.

## The list is private and the API call is authenticated

Listmonk's `/api/public/subscription` needs no credential, and a captcha on the public
subscription page does not cover it. Listmonk has to be publicly reachable anyway, because
the confirmation and unsubscribe links in every mail point at it, so leaving those endpoints
on would expose an open subscribe API to the internet beside them. The site posts to
`/api/subscribers` with an API user and token instead, which lets the public subscription
page be turned off entirely and leaves `/subscribe` on this origin as the only way onto the
list. A private list follows from that and is worth having on its own: a private list's UUID
is refused by the public API, and its name is never shown on a public page, in opt-in mail,
or on an unsubscribe page.

The list is double opt-in. The form is open to anyone, so single opt-in would let one person
put another person's address on the list, which is a harassment pattern rather than a
hypothetical, and unconfirmed addresses are what generate the complaints and bounces that
cost a sending domain its reputation. That domain also carries my personal mail, so the
downside of a dirty list does not land on the newsletter. The price is the fifth or so of
people who type an address and never click, and they were not going to read it either.

## Consequences

Four variables configure the endpoint, all read from `process.env` while the server runs,
for the reason ADR-0001 gives: `LISTMONK_URL`, the origin to post to, written without a
trailing slash, `LISTMONK_LIST_ID`, the numeric id of the list, and `LISTMONK_API_USER` with
`LISTMONK_API_TOKEN`, created under API users in Listmonk. Leave any of them unset and the
form renders, the post fails, and the reader is told nothing was sent.

A successful create also pushes a notification to ntfy, because a list I do not watch is a
list I find out about a week late. Three more variables configure it, read the same way and on
the same terms: `NTFY_URL`, the origin, without a trailing slash, `NTFY_TOPIC`, and
`NTFY_TOKEN`, an access token sent as a bearer. Leave the origin or the topic unset and no
push is attempted and nothing else changes. The push carries the address itself, which is the
only thing that makes it worth reading, and that is a deliberate exception to keeping the list
inside Listmonk: it puts a reader's address on a lock screen, so the topic belongs on my own
ntfy instance and is not one to share with anyone. The request is made by the server on its own
behalf, so ADR-0001 is untouched: no browser talks to ntfy. It is started and not waited for,
so a slow ntfy cannot sit between the reader and the page telling them to check their mail, and
a push that times out or is refused is swallowed rather than surfaced, since a notification that
did not arrive has changed nothing about the subscription and telling the reader it failed
because my phone did not ring would be a lie. Only a create is worth a
push; the conflict that answers a second subscribe is not news, and a bot caught by the honeypot
never reaches Listmonk at all.

The opt-in mail is Listmonk's to send: the subscriber is created without
`preconfirm_subscriptions`, so a double opt-in list mails the confirmation and the row stays
unconfirmed until it is clicked. An address already on the list comes back as a conflict and
is answered as success, because telling one person that another is subscribed discloses the
list.

The newsletter sends under its own DKIM selector and its own bounce subdomain, so a
complaint pattern lands on the newsletter's reputation rather than on `hello@`.

Consent is what the page says it is: a mail when an entry is published, nothing else, and an
unsubscribe link in every one. Changing what the list is used for is not a change to this
file, it is a new ask to the people already on it.

Only `src/pages/subscribe.astro` knows Listmonk exists. The form posts to this site, so
replacing what holds the list is one file and no change to any page.
