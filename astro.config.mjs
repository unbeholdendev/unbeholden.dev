// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import tailwindcss from '@tailwindcss/vite';

// Colours are CSS custom properties, not hex, so one build serves both modes.
const shikiTheme = {
  name: 'unbeholden',
  type: /** @type {const} */ ('dark'),
  colors: { 'editor.background': 'transparent', 'editor.foreground': 'var(--fg)' },
  settings: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: 'var(--faint)' },
    },
    {
      scope: ['string', 'constant.numeric', 'constant.language', 'support.constant'],
      settings: { foreground: 'var(--accent)' },
    },
    {
      scope: ['keyword', 'storage', 'entity.name.tag', 'support.function', 'variable.language'],
      settings: { foreground: 'var(--dim)' },
    },
  ],
};

export default defineConfig({
  site: 'https://unbeholden.dev',
  // Every page stays prerendered. The adapter is here for the analytics proxy alone.
  adapter: node({ mode: 'standalone' }),
  markdown: {
    shikiConfig: { theme: shikiTheme },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
