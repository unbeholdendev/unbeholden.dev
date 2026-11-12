import assert from 'node:assert/strict';
import { test } from 'node:test';
import { shape, type Raw, type RawCommit } from '../src/lib/activity';

const now = new Date('2026-11-11T12:00:00Z');
const at = (days: number) => new Date(now.getTime() - days * 86_400_000).toISOString();

const commit = (message: string, committedDate = at(1)): RawCommit => ({
	url: `https://github.com/unbeholdendev/x/commit/${message.length}`,
	message,
	committedDate,
});

const repo = (name: string, history: RawCommit[]) => ({
	name,
	url: `https://github.com/unbeholdendev/${name}`,
	defaultBranchRef: { target: { history: { nodes: history } } },
});

const pr = (title: string, state: 'OPEN' | 'CLOSED' | 'MERGED', date: string) => ({
	title,
	url: `https://github.com/up/stream/pull/${title.length}`,
	state,
	createdAt: state === 'MERGED' ? '2020-01-01T00:00:00Z' : date,
	mergedAt: state === 'MERGED' ? date : null,
	repository: { nameWithOwner: 'up/stream' },
});

const raw = (repos: ReturnType<typeof repo>[], prs: Raw['search']['nodes'] = []): Raw => ({
	user: { repositories: { nodes: repos } },
	search: { nodes: prs },
});

const titles = (items: { title: string }[]) => items.map((item) => item.title);

test('a squash commit becomes an item without its Forgejo PR number', () => {
	const activity = shape(raw([repo('groat', [commit('Add a ledger (#12)')])]), now);
	assert.deepEqual(activity.days[0].groups[0].items, [
		{ repo: 'groat', title: 'Add a ledger', url: 'https://github.com/unbeholdendev/x/commit/18', date: new Date(at(1)) },
	]);
});

test('the title is the first line of the message', () => {
	const activity = shape(raw([repo('groat', [commit('Rework the AI experience (#40)\n\nBody')])]), now);
	assert.deepEqual(titles(activity.days[0].groups[0].items), ['Rework the AI experience']);
});

test('commits from the last 14 days group by day, then by repo, newest first', () => {
	const hours = (repo: string, count: number) =>
		Array.from({ length: count }, (_, hour) => commit(`${repo} ${hour}`, new Date(now.getTime() - hour * 3_600_000).toISOString()));
	const activity = shape(
		raw([repo('groat', hours('groat', 30)), repo('infra', [commit('Update traefik', at(0.01)), commit('Old', at(100))])]),
		now,
	);
	assert.deepEqual(
		activity.days.map((day) => [day.date.toISOString(), day.groups.map((group) => [group.repo, group.items.length])]),
		[
			[now.toISOString(), [['groat', 13], ['infra', 1]]],
			[at(13 / 24), [['groat', 17]]],
		],
	);
	assert.deepEqual(titles(activity.days[0].groups[0].items.slice(0, 2)), ['groat 0', 'groat 1']);

	const edge = shape(raw([repo('r', [commit('in', at(13.9)), commit('out', at(14.1))])]), now);
	assert.deepEqual(titles(edge.days.flatMap((day) => day.groups.flatMap((group) => group.items))), ['in']);
});

test('contributions are open or merged pull requests, newest first, however old', () => {
	const activity = shape(
		raw(
			[],
			[
				pr('Open one', 'OPEN', '2026-11-08T00:00:00Z'),
				pr('Merged one', 'MERGED', '2026-11-10T00:00:00Z'),
				pr('Closed one', 'CLOSED', '2026-11-10T00:00:00Z'),
				pr('Old one', 'MERGED', '2025-06-01T00:00:00Z'),
			],
		),
		now,
	);
	assert.deepEqual(
		activity.pulls.map((item) => [item.title, item.repo, item.date]),
		[
			['Merged one', 'up/stream', new Date('2026-11-10T00:00:00Z')],
			['Open one', 'up/stream', new Date('2026-11-08T00:00:00Z')],
			['Old one', 'up/stream', new Date('2025-06-01T00:00:00Z')],
		],
	);
	assert.deepEqual(activity.days, []);
});

test("a repo's latest is its head commit, even outside the window", () => {
	const activity = shape(raw([repo('groat', [commit('Recent')]), repo('lnrecc', [commit('Quiet', '2024-09-23T07:58:39Z')])]), now);
	assert.deepEqual(activity.latest('https://github.com/unbeholdendev/lnrecc'), new Date('2024-09-23T07:58:39Z'));
	assert.deepEqual(activity.latest('https://github.com/UnbeholdenDev/groat'), new Date(at(1)));
	assert.equal(activity.latest('https://github.com/unbeholdendev/missing'), undefined);
});

test('lately names the busiest repos of the last fortnight', () => {
	const activity = shape(
		raw(
			[
				repo('groat', [commit('a', at(1)), commit('b', at(2))]),
				repo('wallet', [commit('c', at(3))]),
				repo('lofextra', [commit('d', at(20)), commit('e', at(21))]),
				repo('reviewer', [commit('f', at(5))]),
				repo('scorecard', [commit('g', at(6))]),
			],
			[pr('Upstream', 'OPEN', at(1)), pr('Upstream again', 'OPEN', at(1))],
		),
		now,
	);
	assert.deepEqual(activity.lately, ['groat', 'wallet', 'reviewer']);
});
