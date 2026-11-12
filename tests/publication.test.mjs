import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = new URL('../dist/client/', import.meta.url);

test('the production build publishes every entry', { timeout: 60_000 }, () => {
	execFileSync('bun', ['run', 'build'], {
		cwd: root,
		stdio: 'pipe',
		env: { ...process.env, NODE_ENV: 'production' },
	});
	const blog = readFileSync(new URL('blog/index.html', output), 'utf8');
	const feed = readFileSync(new URL('feed.xml', output), 'utf8');
	const sitemap = readFileSync(new URL('sitemap-0.xml', output), 'utf8');
	const entries = readdirSync(new URL('../src/entries/', import.meta.url), { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name);

	for (const id of entries) {
		assert.ok(existsSync(new URL(`blog/${id}/index.html`, output)), `${id}: article`);
		assert.ok(blog.includes(`href="/blog/${id}"`), `${id}: blog list`);
		assert.ok(feed.includes(`<id>https://unbeholden.dev/blog/${id}</id>`), `${id}: feed`);
		assert.ok(sitemap.includes(`<loc>https://unbeholden.dev/blog/${id}</loc>`), `${id}: sitemap`);
	}

	const home = readFileSync(new URL('index.html', output), 'utf8');
	const latest = [...new Set([...blog.matchAll(/href="(\/blog\/[^"#]+)"/g)].map((match) => match[1]))].slice(0, 3);
	assert.ok(latest.length > 0, 'blog lists entries');
	for (const href of latest) {
		assert.ok(home.includes(href), `${href}: home page`);
	}
});
