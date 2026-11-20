const WINDOW = 60 * 60 * 1000;

export type Admission = 'ok' | 'first-over' | 'over';

export function rateLimiter({ perClient, total }: { perClient: number; total: number }) {
	let start = 0;
	let count = 0;
	let clients = new Map<string, number>();
	return (client: string, now = Date.now()): Admission => {
		if (now - start >= WINDOW) {
			start = now;
			count = 0;
			clients = new Map();
		}
		const sent = (clients.get(client) ?? 0) + 1;
		clients.set(client, sent);
		if (sent > perClient) return 'over';
		count += 1;
		return count <= total ? 'ok' : count === total + 1 ? 'first-over' : 'over';
	};
}

// Held in memory, so a restart forgives whoever filled them.
export const contactLimit = rateLimiter({ perClient: 3, total: 10 });
export const subscribeLimit = rateLimiter({ perClient: 3, total: 30 });
