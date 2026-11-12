// @ts-check

import { satteri } from '@astrojs/markdown-satteri';
import mdx from '@astrojs/mdx';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

// Colours are CSS custom properties, not hex, so one build serves both modes.
const shikiTheme = {
	name: 'unbeholden',
	type: /** @type {const} */ ('dark'),
	colors: { 'editor.background': 'transparent', 'editor.foreground': 'var(--dim)' },
	settings: [
		{
			scope: ['comment', 'punctuation.definition.comment'],
			settings: { foreground: 'var(--faint)' },
		},
	],
};

// A link in an entry leaves the entry, so it opens beside the post rather than
// over it.
const linksInNewTab = {
	name: 'links-in-new-tab',
	element: {
		filter: ['a'],
		visit(/** @type {any} */ node, /** @type {any} */ ctx) {
			if (!node.properties?.href) return;
			ctx.setProperty(node, 'target', '_blank');
			ctx.setProperty(node, 'rel', 'noopener noreferrer');
		},
	},
};

export default defineConfig({
	site: 'https://unbeholden.dev',
	trailingSlash: 'never',
	adapter: node({ mode: 'standalone' }),
	redirects: { '/built': '/work' },
	// MDX so an entry can import its diagram. Astro inlines an imported SVG, and
	// only an inlined one reads the page's colour mode.
	// /subscribe is where the form posts. A reader arriving by GET is sent to the front
	// page, so announcing it as a page of the site announces a redirect.
	integrations: [mdx(), sitemap({ filter: (page) => !page.endsWith('/subscribe') })],
	markdown: {
		shikiConfig: { theme: shikiTheme },
		processor: satteri({ hastPlugins: [linksInNewTab] }),
	},
	// Unset, `X-Forwarded-Proto` is ignored, so behind Traefik the server reads its own
	// request as http and rejects the subscribe form for crossing origins.
	security: {
		allowedDomains: [{ hostname: 'unbeholden.dev', protocol: 'https' }],
	},
	vite: {
		plugins: [tailwindcss()],
	},
});
