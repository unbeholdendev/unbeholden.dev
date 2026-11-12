const login = 'unbeholdendev';
const second = 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;
const span = 14 * day;

export interface RawCommit {
	url: string;
	message: string;
	committedDate: string;
}

interface RawPull {
	title: string;
	url: string;
	state: 'OPEN' | 'CLOSED' | 'MERGED';
	createdAt: string;
	mergedAt: string | null;
	repository: { nameWithOwner: string };
}

export interface Raw {
	user: {
		repositories: {
			nodes: {
				name: string;
				url: string;
				defaultBranchRef: { target: { history?: { nodes: RawCommit[] } } } | null;
			}[];
		};
	};
	search: { nodes: (RawPull | Record<string, never>)[] };
}

export interface Item {
	repo: string;
	title: string;
	url: string;
	date: Date;
}

export interface Group {
	repo: string;
	items: Item[];
}

export interface Day {
	date: Date;
	groups: Group[];
}

export interface Activity {
	days: Day[];
	pulls: Item[];
	lately: string[];
	latest(repoUrl: string): Date | undefined;
}

const title = (commit: RawCommit) => commit.message.split('\n', 1)[0].replace(/\s*\(#\d+\)$/, '');
const thisYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format;
const pastYear = new Intl.DateTimeFormat('en-GB', { month: 'short', year: 'numeric' }).format;
export const shortDate = (date: Date) => (date.getFullYear() === new Date().getFullYear() ? thisYear : pastYear)(date);
const newestFirst = (a: Item, b: Item) => b.date.getTime() - a.date.getTime();

/** Items newest first, grouped by UTC day and then by repo. */
export function byDay(items: Item[]): Day[] {
	const days: Day[] = [];
	for (const item of items) {
		let day = days.at(-1);
		if (day?.date.toISOString().slice(0, 10) !== item.date.toISOString().slice(0, 10))
			days.push((day = { date: item.date, groups: [] }));
		let group = day.groups.find((group) => group.repo === item.repo);
		if (!group) day.groups.push((group = { repo: item.repo, items: [] }));
		group.items.push(item);
	}
	return days;
}

export function shape(raw: Raw, now: Date): Activity {
	const heads = new Map<string, Date>();
	const commits = raw.user.repositories.nodes
		.flatMap((repo) => {
			const items = (repo.defaultBranchRef?.target.history?.nodes ?? []).map(
				(commit): Item => ({
					repo: repo.name,
					title: title(commit),
					url: commit.url,
					date: new Date(commit.committedDate),
				}),
			);
			if (items[0]) heads.set(repo.url.toLowerCase(), items[0].date);
			return items.filter((item) => item.date.getTime() >= now.getTime() - span);
		})
		.sort(newestFirst);

	const pulls = raw.search.nodes
		.filter((pull): pull is RawPull => 'state' in pull && pull.state !== 'CLOSED')
		.map(
			(pull): Item => ({
				repo: pull.repository.nameWithOwner,
				title: pull.title,
				url: pull.url,
				date: new Date(pull.mergedAt ?? pull.createdAt),
			}),
		)
		.sort(newestFirst);

	const counts = new Map<string, number>();
	for (const item of commits) counts.set(item.repo, (counts.get(item.repo) ?? 0) + 1);

	return {
		days: byDay(commits),
		pulls,
		// Map keeps insertion order, newest first, so equal counts stay in recency order.
		lately: [...counts]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 3)
			.map(([repo]) => repo),
		latest: (repoUrl) => heads.get(repoUrl.toLowerCase()),
	};
}

const query = `query($login: String!, $search: String!) {
	user(login: $login) {
		repositories(first: 50, ownerAffiliations: OWNER, isFork: false, privacy: PUBLIC, orderBy: {field: PUSHED_AT, direction: DESC}) {
			nodes {
				name url
				defaultBranchRef { target { ... on Commit {
					history(first: 100) { nodes { url message committedDate } }
				} } }
			}
		}
	}
	search(query: $search, type: ISSUE, first: 50) {
		nodes { ... on PullRequest { title url state createdAt mergedAt repository { nameWithOwner } } }
	}
}`;

const token = process.env.GITHUB_TOKEN;
let last: Activity | undefined;
let loading: Promise<void> | undefined;
let nextRefresh = 0;

async function load() {
	const now = new Date();
	const response = await fetch('https://api.github.com/graphql', {
		method: 'POST',
		headers: { authorization: `bearer ${token}`, 'content-type': 'application/json' },
		body: JSON.stringify({
			query,
			variables: { login, search: `is:pr is:public author:${login} -user:${login} sort:updated-desc` },
		}),
		signal: AbortSignal.timeout(30 * second),
	});
	if (!response.ok) throw new Error(`GitHub ${response.status}`);
	const json = (await response.json()) as { data?: Raw; errors?: unknown };
	if (!json.data?.user) throw new Error(`GitHub: ${JSON.stringify(json.errors)}`);
	return shape(json.data, now);
}

function refresh() {
	loading ??= load()
		.then((activity) => {
			last = activity;
			nextRefresh = Date.now() + hour;
		})
		.catch((error) => {
			console.error('activity:', error);
			nextRefresh = Date.now() + 5 * minute;
		})
		.finally(() => {
			loading = undefined;
		});
	return loading;
}

/** Cached activity; stale while it refreshes, kept when GitHub fails, absent when never fetched in time. */
export async function getActivity(): Promise<Activity | undefined> {
	if (!token) return undefined;
	if (Date.now() >= nextRefresh) {
		const pending = refresh();
		if (!last) await Promise.race([pending, new Promise((resolve) => setTimeout(resolve, 3 * second))]);
	}
	return last;
}
