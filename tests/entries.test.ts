import assert from 'node:assert/strict';
import { test } from 'node:test';
import { absoluteUrls, articleStats } from '../src/lib/entries';

const origin = 'https://unbeholden.dev';

test('root-relative links and images in tags point at the origin', () => {
	assert.equal(
		absoluteUrls('<a href="/blog/x">x</a><img src="/a.png" srcset="/a.png 2x">', origin),
		'<a href="https://unbeholden.dev/blog/x">x</a><img src="https://unbeholden.dev/a.png" srcset="https://unbeholden.dev/a.png 2x">',
	);
});

test('protocol-relative, absolute and fragment links stay as written', () => {
	const html = '<a href="//cdn.example/x"></a><a href="https://example.org/"></a><a href="#top"></a><a href="x/y"></a>';
	assert.equal(absoluteUrls(html, origin), html);
});

test('a root-relative path in the prose is the author’s text', () => {
	const html = '<code>href="/blog"</code> and &lt;a href="/x"&gt;';
	assert.equal(absoluteUrls(html, origin), html);
});

const minutes = (body: string | undefined) => articleStats({ body }).minutes;
const words = (count: number) => Array(count).fill('word').join(' ');

test('reading time is words over 220 a minute, at least one', () => {
	assert.equal(minutes(undefined), 1);
	assert.equal(minutes(''), 1);
	assert.equal(minutes(words(549)), 2);
	assert.equal(minutes(words(551)), 3);
	assert.equal(minutes(words(2200)), 10);
});

test('code, imports, markup and link targets are not counted', () => {
	const body = [
		"import Figure from '../Figure.astro';",
		'# Heading',
		'```ts',
		words(1000),
		'```',
		'<Figure src="/a.png" alt="many words here" />',
		'- [link text](https://example.org/a/very/long/path)',
		'> **bold** `code`',
		words(650),
	].join('\n');
	assert.equal(minutes(body), 3);
});
