import type { APIRoute } from 'astro';
import { render } from 'astro:content';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { listEntries } from '../lib/entries';

const escape = (text: string) => text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);

const cdata = (html: string) => `<![CDATA[${html.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

// Only inside a tag: a root-relative path in the prose itself, such as one quoted in a
// code sample, is the author's text and stays as written.
const absolute = (html: string, origin: string) =>
	html.replace(/<[a-z][^>]*>/gi, (tag) =>
		tag.replace(/(href|src|srcset)="\/(?!\/)/g, `$1="${origin}/`),
	);

export const GET: APIRoute = async ({ site }) => {
	if (!site) throw new Error('The feed needs `site` set in astro.config.mjs.');
	const origin = new URL(site).origin;
	const url = (path: string) => new URL(path, site).href;

	const container = await AstroContainer.create();
	const entries = (await listEntries()).filter(({ data }) => !data.draft);

	const items = await Promise.all(
		entries.map(async (entry) => {
			const { Content } = await render(entry);
			const article = absolute(await container.renderToString(Content), origin);
			const { title, summary, topic, date, updated } = entry.data;
			const href = url(`blog/${entry.id}`);
			return `		<entry>
			<title>${escape(title)}</title>
			<id>${escape(href)}</id>
			<link rel="alternate" type="text/html" href="${escape(href)}" />
			<published>${date.toISOString()}</published>
			<updated>${(updated ?? date).toISOString()}</updated>
			<category term="${escape(topic)}" />
			<summary>${escape(summary)}</summary>
			<content type="html">${cdata(article)}</content>
		</entry>`;
		}),
	);

	const stamps = entries.map(({ data }) => (data.updated ?? data.date).getTime());

	const body = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="en-GB">
	<title>Unbeholden</title>
	<subtitle>Digital sovereignty, in practice. Every entry in full, so you can read it without loading the site.</subtitle>
	<id>${escape(url('/'))}</id>
	<link rel="alternate" type="text/html" href="${escape(url('/'))}" />
	<link rel="self" type="application/atom+xml" href="${escape(url('feed.xml'))}" />
	<updated>${new Date(stamps.length ? Math.max(...stamps) : 0).toISOString()}</updated>
	<author><name>Unbeholden</name></author>
	<rights>Prose CC BY 4.0. Code CC0/MIT.</rights>
${items.join('\n')}
</feed>
`;

	return new Response(body, {
		headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
	});
};
