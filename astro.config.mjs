// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';

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

export default defineConfig({
  site: 'https://unbeholden.dev',
  // Every page stays prerendered. The adapter is here for the analytics proxy alone.
  adapter: node({ mode: 'standalone' }),
  // MDX so an entry can import its diagram. Astro inlines an imported SVG, and
  // only an inlined one reads the page's colour mode.
  integrations: [mdx()],
  markdown: {
    shikiConfig: { theme: shikiTheme },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
