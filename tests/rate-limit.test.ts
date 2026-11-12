import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rateLimiter } from '../src/lib/rate-limit';

const hour = 3_600_000;
const start = Date.parse('2026-11-11T12:00:00Z');

test('ten an hour, then the first over, then over', () => {
	const admit = rateLimiter();
	const results = Array.from({ length: 13 }, (_, i) => admit(start + i));
	assert.deepEqual(results, [...Array(10).fill('ok'), 'first-over', 'over', 'over']);
});

test('the count resets an hour after the window opened, not after the last message', () => {
	const admit = rateLimiter();
	for (let i = 0; i < 12; i++) admit(start + i * 60_000);
	assert.equal(admit(start + hour - 1), 'over');
	assert.equal(admit(start + hour), 'ok');
	for (let i = 0; i < 9; i++) admit(start + hour);
	assert.equal(admit(start + hour), 'first-over');
});
