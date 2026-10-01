// Read at runtime, not through import.meta.env, which Vite would freeze into the build.
const url = process.env.NTFY_URL;
const topic = process.env.NTFY_TOPIC;
const token = process.env.NTFY_TOKEN;

// ntfy takes an access token as a bearer, and a username and password as Basic. A value that
// already names its scheme is sent exactly as it is written; a bare one is an access token.
const credential = token && (/^(Basic|Bearer) /i.test(token) ? token : `Bearer ${token}`);

interface Push {
	title: string;
	message: string;
	tags: string[];
	actions?: { action: 'view'; label: string; url: string }[];
}

// JSON rather than headers, because a header cannot carry a reader's name outside Latin-1.
export async function push(body: Push) {
	if (!url || !topic) return false;
	try {
		const sent = await fetch(url, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				...(credential ? { authorization: credential } : {}),
			},
			body: JSON.stringify({ topic, ...body }),
			signal: AbortSignal.timeout(3000),
		});
		return sent.ok;
	} catch {
		return false;
	}
}
