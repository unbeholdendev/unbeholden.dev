import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { GET, POST } from '../src/pages/u/[...path]';

process.env.UMAMI_URL = 'https://umami.internal';

const realFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = realFetch;
});

let sent: { url: string; init: RequestInit }[];
function upstream(response: Response) {
	sent = [];
	globalThis.fetch = (async (url: string, init: RequestInit) => {
		sent.push({ url, init });
		return response;
	}) as typeof fetch;
}

const call = (route: typeof GET, path: string, request: Request) =>
	route({ params: { path }, request, clientAddress: '10.0.0.9' } as unknown as Parameters<
		typeof GET
	>[0]) as Promise<Response>;

test('only the script and the send endpoint are proxied', async () => {
	upstream(new Response('ok'));
	for (const path of ['login', 'api/auth/login', 'script.js/../login', '']) {
		const response = await call(GET, path, new Request('https://unbeholden.dev/u/x'));
		assert.equal(response.status, 404, path);
	}
	assert.equal(sent.length, 0);
	assert.equal((await call(GET, 'script.js', new Request('https://unbeholden.dev/u/script.js'))).status, 200);
	assert.equal(sent[0].url, 'https://umami.internal/script.js');
});

test('only allowlisted headers go upstream and come back', async () => {
	upstream(
		new Response('js', {
			status: 200,
			headers: {
				'content-type': 'text/javascript',
				'cache-control': 'max-age=60',
				etag: '"1"',
				'last-modified': 'Wed, 11 Nov 2026 00:00:00 GMT',
				server: 'umami.internal',
				'set-cookie': 'a=b',
			},
		}),
	);
	const response = await call(
		GET,
		'script.js',
		new Request('https://unbeholden.dev/u/script.js', {
			headers: { 'user-agent': 'Firefox', cookie: 'secret=1', 'x-umami-cache': 'abc', referer: 'https://x' },
		}),
	);
	assert.deepEqual(
		[...new Headers(sent[0].init.headers)],
		[
			['user-agent', 'Firefox'],
			['x-umami-cache', 'abc'],
		],
	);
	assert.deepEqual(
		[...response.headers],
		[
			['cache-control', 'max-age=60'],
			['content-type', 'text/javascript'],
			['etag', '"1"'],
			['last-modified', 'Wed, 11 Nov 2026 00:00:00 GMT'],
		],
	);
	assert.equal(await response.text(), 'js');
});

const send = (body: string, headers: Record<string, string> = {}) =>
	call(POST, 'api/send', new Request('https://unbeholden.dev/u/api/send', { method: 'POST', body, headers }));

test("the payload's ip is the first X-Forwarded-For entry", async () => {
	upstream(new Response(null, { status: 204 }));
	await send(JSON.stringify({ type: 'event', payload: { url: '/', ip: '6.6.6.6' } }), {
		'x-forwarded-for': ' 1.2.3.4 , 5.6.7.8',
	});
	assert.equal(sent[0].init.method, 'POST');
	assert.deepEqual(JSON.parse(String(sent[0].init.body)), { type: 'event', payload: { url: '/', ip: '1.2.3.4' } });
});

test('without X-Forwarded-For the ip is the client address', async () => {
	upstream(new Response(null, { status: 204 }));
	await send(JSON.stringify({ payload: {} }));
	assert.deepEqual(JSON.parse(String(sent[0].init.body)), { payload: { ip: '10.0.0.9' } });
});

test('a body without a payload, or not JSON, passes through as sent', async () => {
	upstream(new Response(null, { status: 204 }));
	await send('{"type":"identify"}');
	await send('not json');
	assert.deepEqual(
		sent.map((call) => call.init.body),
		['{"type":"identify"}', 'not json'],
	);
});

test('an unreachable upstream is a 502', async () => {
	globalThis.fetch = (async () => {
		throw new TypeError('fetch failed');
	}) as unknown as typeof fetch;
	assert.equal((await call(GET, 'script.js', new Request('https://unbeholden.dev/u/script.js'))).status, 502);
});
