import assert from 'node:assert/strict';
import { test } from 'node:test';
import { rateLimiter } from '../src/lib/rate-limit';

const hour = 3_600_000;
const start = Date.parse('2026-11-11T12:00:00Z');
const limits = { perClient: 3, total: 10 };

test('three an hour from one client, while the others still get through', () => {
	const admit = rateLimiter(limits);
	const results = Array.from({ length: 5 }, (_, i) => admit('1.1.1.1', start + i));
	assert.deepEqual(results, ['ok', 'ok', 'ok', 'over', 'over']);
	assert.equal(admit('2.2.2.2', start + 5), 'ok');
});

test('ten an hour in all, then the first over, then over', () => {
	const admit = rateLimiter(limits);
	const results = Array.from({ length: 13 }, (_, i) => admit(`10.0.0.${i}`, start + i));
	assert.deepEqual(results, [...Array(10).fill('ok'), 'first-over', 'over', 'over']);
});

test('a client refused for its own count does not use up the total', () => {
	const admit = rateLimiter(limits);
	for (let i = 0; i < 100; i++) admit('1.1.1.1', start + i);
	const others = Array.from({ length: 7 }, (_, i) => admit(`10.0.0.${i}`, start + 100 + i));
	assert.deepEqual(others, Array(7).fill('ok'));
	assert.equal(admit('10.0.0.99', start + 200), 'first-over');
});

test('the counts reset an hour after the window opened, not after the last message', () => {
	const admit = rateLimiter(limits);
	for (let i = 0; i < 12; i++) admit(`10.0.0.${i % 4}`, start + i * 60_000);
	assert.equal(admit('10.0.0.9', start + hour - 1), 'over');
	assert.equal(admit('10.0.0.0', start + hour), 'ok');
	for (let i = 0; i < 9; i++) admit(`10.0.1.${i}`, start + hour);
	assert.equal(admit('10.0.2.0', start + hour), 'first-over');
});
