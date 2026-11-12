const LIMIT = 10;
const WINDOW = 60 * 60 * 1000;

export type Admission = 'ok' | 'first-over' | 'over';

export function rateLimiter() {
	let start = 0;
	let count = 0;
	return (now = Date.now()): Admission => {
		if (now - start >= WINDOW) {
			start = now;
			count = 0;
		}
		count += 1;
		return count <= LIMIT ? 'ok' : count === LIMIT + 1 ? 'first-over' : 'over';
	};
}

// One count for every reader, held in memory, so a restart forgives whoever filled it.
export const rateLimit = rateLimiter();
