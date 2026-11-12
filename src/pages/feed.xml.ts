import { loadRenderers } from 'astro:container';
import { render } from 'astro:content';
import { getContainerRenderer } from '@astrojs/mdx/container-renderer';
import type { APIRoute } from 'astro';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { Feed } from 'feed';
import { absoluteUrls, listEntries } from '../lib/entries';

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('The feed needs `site` set in astro.config.mjs.');
	const origin = new URL(site).origin;
	const url = (path: string) => new URL(path, site).href;

	// An entry is MDX, so the container needs the renderer that turns it into HTML.
	const container = await AstroContainer.create({
		renderers: await loadRenderers([getContainerRenderer()]),
	});
	const entries = await listEntries();
	const stamps = entries.map(({ data }) => (data.updated ?? data.date).getTime());

	const feed = new Feed({
		title: 'Unbeholden',
		description:
			'Software, and the infrastructure behind it. Every entry in full, so you can read it without loading the site.',
		id: url('/'),
		link: url('/'),
		feedLinks: { atom: url('feed.xml') },
		updated: new Date(stamps.length ? Math.max(...stamps) : 0),
		author: { name: 'Jakub' },
		copyright: 'Prose CC BY 4.0. Code CC0/MIT.',
		generator: false,
	});

	for (const entry of entries) {
		const { Content } = await render(entry);
		const { title, summary, topic, date, updated } = entry.data;
		const href = url(`blog/${entry.id}`);
		feed.addItem({
			title,
			id: href,
			link: href,
			published: date,
			date: updated ?? date,
			category: [{ term: topic }],
			description: summary,
			content: absoluteUrls(await container.renderToString(Content), origin),
		});
	}

	// The library applies `language` to RSS alone, so the Atom root needs it here.
	const atom = feed.atom1().replace('<feed xmlns', '<feed xml:lang="en-GB" xmlns');

	return new Response(atom, {
		headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
	});
};
