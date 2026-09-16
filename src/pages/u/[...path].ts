import type { APIRoute } from 'astro';

export const prerender = false;

// import.meta.env freezes the value into the bundle at build; this has to be read at runtime.
const upstream = process.env.UMAMI_URL;

const strip = ['host', 'cookie', 'connection', 'content-length', 'accept-encoding'];

// Allowlisted, so a response header naming the origin cannot leak by being added upstream.
const expose = ['content-type', 'cache-control', 'etag', 'last-modified'];

const proxy: APIRoute = async ({ params, request }) => {
	// A catch-all would publish Umami's login route on this domain.
	const path = params.path;
	if (!upstream || (path !== 'script.js' && path !== 'api/send')) {
		return new Response(null, { status: 404 });
	}

	const headers = new Headers(request.headers);
	for (const name of strip) headers.delete(name);

	let response: Response;
	try {
		response = await fetch(`${upstream}/${path}`, {
			method: request.method,
			headers,
			body: request.method === 'POST' ? await request.text() : undefined,
			signal: AbortSignal.timeout(3000),
		});
	} catch {
		return new Response(null, { status: 502 });
	}

	const out = new Headers();
	for (const name of expose) {
		const value = response.headers.get(name);
		if (value) out.set(name, value);
	}
	return new Response(response.body, { status: response.status, headers: out });
};

export const GET = proxy;
export const POST = proxy;
