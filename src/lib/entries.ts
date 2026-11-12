import type { CollectionEntry } from 'astro:content';

const WORDS_PER_MINUTE = 220;

export const day = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'long',
	year: 'numeric',
}).format;

export const readTime = (minutes: number) =>
	`${minutes} minute${minutes === 1 ? '' : 's'}`;

export async function listEntries() {
	// Loaded on call, so the tests can import this module outside Astro.
	const { getCollection } = await import('astro:content');
	const entries = await getCollection('entries');
	return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function articleStats(entry: Pick<CollectionEntry<'entries'>, 'body'>) {
	const prose = (entry.body ?? '')
		.replace(/```[\s\S]*?```/g, '')
		.replace(/^import .*$/gm, '')
		.replace(/<[^>]*>/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s*(#{1,6}|[-*+]|>|\d+\.)\s+/gm, '')
		.replace(/[`*_~]/g, '');
	const words = prose.split(/\s+/).filter(Boolean).length;
	return { minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) };
}

// Only inside a tag: a root-relative path in the prose itself, such as one quoted in a
// code sample, is the author's text and stays as written.
export const absoluteUrls = (html: string, origin: string) =>
	html.replace(/<[a-z][^>]*>/gi, (tag) =>
		tag.replace(/(href|src|srcset)="\/(?!\/)/g, `$1="${origin}/`),
	);
