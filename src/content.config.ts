import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

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
