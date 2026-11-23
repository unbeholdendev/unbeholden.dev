---
title: The best off-site backup I've found
date: 2026-11-24
summary: The NAS doesn't help if the house burns down. The off-site copy goes to S3 Glacier Deep Archive, encrypted before it leaves home, for about $0.60 a month.
topic: Self-hosting
poster:
  src: ./poster.jpg
  alt: An open hard drive in the dark, its platter, spindle and read arm lit in silver with flecks of orange.
---

At home, everything ends up on the TrueNAS box, including the photos and the backups of the apps
on the [cluster](/blog/getting-my-homelab-into-git). It covers a failed disk or a file I deleted by
mistake. It doesn't cover a fire or a burglary, because it's all in one house.

So the data I couldn't replace, each family member's personal folder, needs a copy somewhere else.
I wanted that copy to cost almost nothing, and I wanted whoever stores it to be unable to read it.
I'm fine with a slow and expensive restore, because I'll only need it when everything at home is
gone.

## Deep Archive

The copy goes to [Amazon S3](https://aws.amazon.com/s3/), in the Glacier Deep Archive storage
class. It's the cheapest storage AWS sells, because it's meant for data you write once and hope
never to read. In Stockholm it's $0.00099 per GB a month, about a dollar a terabyte. I pay around
$0.60 a month, so roughly 600 GB.

The catch is getting it back. You can't download an object straight away. You ask S3 to restore it
first, which takes up to 12 hours, or up to 48 hours for the cheaper bulk restore. Then you pay for
the restore and for the download. S3 also bills each object for at least 180 days, even if you
delete it sooner.

## Encrypted before it leaves

A Cloud Sync task in TrueNAS uploads the folders, set to the Deep Archive storage class. TrueNAS
encrypts the files before they leave the NAS, so AWS only ever stores ciphertext. Anyone who gets
into the bucket, AWS included, sees nothing they can read.

That part doesn't depend on AWS. Cloud Sync encrypts the same way for any provider, so the choice
of provider comes down to price.

## Against other providers

Most storage aimed at backups costs more to keep but nothing to get back. Take
[Backblaze B2](https://www.backblaze.com/cloud-storage), a common choice for off-site backups.
It's $6.95 per TB a month, downloads are free up to three times what you store, and nothing waits
for a restore. For 600 GB, that's about $4.20 a month against $0.60.

A full restore from Deep Archive costs more. The bulk restore of 600 GB is $1.80. AWS doesn't
charge for the first 100 GB a month that leave it, and charges $0.09 per GB after that, so the
download is $45. That makes about $47, or $57 with the 12-hour restore. From B2 it would be free.

B2 costs about $43 a year more, close to the price of one full restore from Deep Archive. If I
expected to restore more than once a year, B2 would come out cheaper. I expect never to restore, so
Deep Archive wins.
