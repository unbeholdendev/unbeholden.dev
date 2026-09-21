# unbeholden.dev

A personal blog arguing that software you depend on should be software you can inspect,
move, and turn off. Its subjects are self-hosted infrastructure, homelab and networking,
Linux, agent tooling, and quality-of-life configuration; its own construction is held to
the same standard it argues for.

## Language

### Content

**Entry**:
One published thing. An entry always has an article and may also have a video.
_Avoid_: post, blog post. Also avoid `guide` and `note` as types — the distinction between
a maintained entry and a dated one is carried by an `updated` date, not by a second type.

**Article**:
The written rendition of an entry. Always present.
_Avoid_: body, content, copy.

**Video**:
The recorded rendition of an entry, published on YouTube. Optional, and complementary to the
article rather than a substitute for it.
_Avoid_: film.

**Poster**:
The single image an entry carries. It heads the entry, stands in for an unplayed video, and
serves as the entry's social preview.
_Avoid_: thumbnail, hero, featured image.

**Topic**:
The one subject label an entry carries. A label only; no page lists entries by topic.
_Avoid_: tag, category.

**Blog**:
Every entry, and the section of the site they live in.
_Avoid_: writing, journal, archive.

### Presentation

**Masthead**:
The row at the top of every page, sitting on a rule: the wordmark and, beneath it, the
tagline, left; the navigation right.

**Statement**:
The opening sentence of the front page and the About page, set large in the display face.
_Avoid_: hero, tagline, strapline.

**Dependency budget**:
The rule governing which network requests a page is permitted to make. See ADR-0001.
_Avoid_: privacy policy — the budget is a construction constraint, not a disclosure.
