import { getCollection, type CollectionEntry } from 'astro:content';

const WORDS_PER_MINUTE = 220;

export const day = new Intl.DateTimeFormat('en-GB', {
	day: 'numeric',
	month: 'short',
	year: 'numeric',
}).format;

export async function listEntries() {
	const entries = await getCollection('entries', ({ data }) => import.meta.env.DEV || !data.draft);
	return entries.sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function articleStats(entry: CollectionEntry<'entries'>) {
	const prose = (entry.body ?? '')
		.replace(/```[\s\S]*?```/g, '')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^\s*(#{1,6}|[-*+]|>|\d+\.)\s+/gm, '')
		.replace(/[`*_~]/g, '');
	const words = prose.split(/\s+/).filter(Boolean).length;
	return { words, minutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)) };
}
