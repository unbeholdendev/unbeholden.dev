import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { sendContact, subscribe, truncateForPush } from '../src/lib/forms';
import type { push } from '../src/lib/ntfy';

type Push = Parameters<typeof push>[0];

const form = (fields: Record<string, string>) => {
	const data = new FormData();
	for (const [name, value] of Object.entries(fields)) data.set(name, value);
	return data;
};

let pushed: Push[];
const notify = (result: boolean) => async (body: Push) => {
	pushed.push(body);
	return result;
};

let logged: unknown[];
const realLog = console.log;
const realFetch = globalThis.fetch;
beforeEach(() => {
	pushed = [];
	logged = [];
	console.log = (line: string) => logged.push(JSON.parse(line));
});
afterEach(() => {
	console.log = realLog;
	globalThis.fetch = realFetch;
	for (const name of Object.keys(listmonk)) delete process.env[name];
});

test('a short message is pushed whole', () => {
	assert.equal(truncateForPush('héllo'), 'héllo');
});

test('a long multi-byte message is cut at 3700 bytes without a broken character', () => {
	const text = 'é'.repeat(1850) + 'x' + 'é'.repeat(10);
	const cut = truncateForPush(text);
	const [kept, note] = cut.split('\n\n');
	assert.equal(kept, 'é'.repeat(1850));
	assert.equal(note, '[Cut short. The whole message is in the server log.]');

	const odd = truncateForPush('x' + 'é'.repeat(2000));
	assert.equal(odd.split('\n\n')[0], 'x' + 'é'.repeat(1849));
	assert.ok(!odd.includes('\uFFFD'));
});

const admit = (result: 'ok' | 'first-over' | 'over') => () => result;

test('a filled honeypot looks sent and does nothing', async () => {
	const result = await sendContact(form({ message: 'Buy now', website: 'spam.example' }), admit('ok'), notify(true));
	assert.equal(result.state, 'sent');
	assert.deepEqual([pushed, logged], [[], []]);
});

test('an empty or overlong message fails without counting against the limit', async () => {
	let counted = 0;
	const counting = () => (counted++, 'ok' as const);
	for (const message of ['', '   ', 'x'.repeat(3501)]) {
		assert.equal((await sendContact(form({ message }), counting, notify(true))).state, 'failed');
	}
	assert.equal(counted, 0);
	assert.equal((await sendContact(form({ message: 'x'.repeat(3500) }), counting, notify(true))).state, 'sent');
});

test('the fields come back trimmed and capped for the form to show again', async () => {
	const result = await sendContact(
		form({ name: ` ${'n'.repeat(120)} `, email: ' a@b.c ', message: ' hi ' }),
		admit('ok'),
		notify(false),
	);
	assert.deepEqual(result, { state: 'failed', name: 'n'.repeat(100), email: 'a@b.c', message: 'hi' });
});

test('a sent message is logged and pushed with a reply action', async () => {
	const result = await sendContact(form({ name: 'Ada', email: 'ada@example.org', message: 'Hello' }), admit('ok'), notify(true));
	assert.equal(result.state, 'sent');
	assert.deepEqual(logged, [{ contact: { name: 'Ada', email: 'ada@example.org', message: 'Hello', admitted: 'ok' } }]);
	assert.deepEqual(pushed, [
		{
			title: 'Message from Ada',
			message: 'Hello\n\nada@example.org',
			tags: ['speech_balloon'],
			actions: [
				{
					action: 'view',
					label: 'Reply',
					url: 'mailto:ada@example.org?subject=Your%20message%20on%20unbeholden.dev',
				},
			],
		},
	]);
});

test('only a plain address gets a reply action', async () => {
	for (const email of ['', '@handle on Mastodon', 'ada@example.org?cc=x@y.z', 'a@b@c']) {
		pushed = [];
		await sendContact(form({ email, message: 'Hello' }), admit('ok'), notify(true));
		assert.equal(pushed[0].actions, undefined, email);
	}
	assert.deepEqual(pushed[0], { title: 'Message', message: 'Hello\n\na@b@c', tags: ['speech_balloon'], actions: undefined });
});

test('a failed push is a failed send', async () => {
	assert.equal((await sendContact(form({ message: 'Hello' }), admit('ok'), notify(false))).state, 'failed');
});

test('the first message over the limit warns once; every one over is logged and refused', async () => {
	const first = await sendContact(form({ message: 'one' }), admit('first-over'), notify(true));
	const later = await sendContact(form({ message: 'two' }), admit('over'), notify(true));
	assert.deepEqual([first.state, later.state], ['limited', 'limited']);
	assert.deepEqual(
		logged.map((line) => (line as { contact: { admitted: string } }).contact.admitted),
		['first-over', 'over'],
	);
	assert.deepEqual(pushed, [
		{
			title: 'Contact form rate-limited',
			message: 'Ten messages this hour. The rest are in the server log.',
			tags: ['warning'],
		},
	]);
});

const listmonk = {
	LISTMONK_URL: 'https://lists.internal',
	LISTMONK_LIST_ID: '3',
	LISTMONK_API_USER: 'site',
	LISTMONK_API_TOKEN: 'secret',
};

let requests: { url: string; init: RequestInit }[];
function upstream(respond: () => Promise<Response>) {
	requests = [];
	globalThis.fetch = (async (url: string, init: RequestInit) => {
		requests.push({ url, init });
		return respond();
	}) as typeof fetch;
}

beforeEach(() => {
	Object.assign(process.env, listmonk);
	upstream(async () => new Response(null, { status: 200 }));
});

test('a filled honeypot looks subscribed and calls nothing', async () => {
	const result = await subscribe(form({ email: 'bot@example.org', website: 'x' }), notify(true));
	assert.deepEqual(result, { ok: true, email: 'bot@example.org' });
	assert.deepEqual([requests, pushed], [[], []]);
});

test('without an address or any Listmonk setting, nothing is sent', async () => {
	assert.equal((await subscribe(form({ email: ' ' }), notify(true))).ok, false);
	for (const name of Object.keys(listmonk)) {
		Object.assign(process.env, listmonk);
		delete process.env[name];
		assert.equal((await subscribe(form({ email: 'a@b.c' }), notify(true))).ok, false, name);
	}
	assert.deepEqual(requests, []);
});

test('a new subscriber is created in Listmonk and pushed', async () => {
	const result = await subscribe(form({ email: ' ada@example.org ' }), notify(true));
	assert.deepEqual(result, { ok: true, email: 'ada@example.org' });
	const [{ url, init }] = requests;
	assert.equal(url, 'https://lists.internal/api/subscribers');
	assert.equal(init.method, 'POST');
	assert.deepEqual(init.headers, { 'content-type': 'application/json', authorization: `Basic ${btoa('site:secret')}` });
	assert.deepEqual(JSON.parse(String(init.body)), {
		email: 'ada@example.org',
		name: 'ada',
		status: 'enabled',
		lists: [3],
	});
	assert.ok(init.signal instanceof AbortSignal);
	assert.deepEqual(pushed, [{ title: 'New subscriber', message: 'ada@example.org', tags: ['envelope'] }]);
});

test('an address already on the list succeeds without a push', async () => {
	upstream(async () => new Response(null, { status: 409 }));
	assert.equal((await subscribe(form({ email: 'ada@example.org' }), notify(true))).ok, true);
	assert.deepEqual(pushed, []);
});

test('an upstream error or a timeout fails without a push', async () => {
	upstream(async () => new Response(null, { status: 500 }));
	assert.equal((await subscribe(form({ email: 'ada@example.org' }), notify(true))).ok, false);
	upstream(async () => {
		throw new DOMException('The operation timed out.', 'TimeoutError');
	});
	assert.equal((await subscribe(form({ email: 'ada@example.org' }), notify(true))).ok, false);
	assert.deepEqual(pushed, []);
});
