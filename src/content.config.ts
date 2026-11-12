import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const entries = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/entries' }),
	schema: ({ image }) =>
		z.object({
			title: z.string(),
			date: z.coerce.date(),
			summary: z.string(),
			topic: z.string(),
			poster: z.object({
				src: image(),
				alt: z.string(),
			}),
			updated: z.coerce.date().optional(),
			video: z
				.object({
					id: z.string(),
					duration: z.string(),
				})
				.optional(),
		}),
});

export const collections = { entries };
