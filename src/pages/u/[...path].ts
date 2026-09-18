import type { APIRoute } from 'astro';

export const prerender = false;

// import.meta.env freezes the value into the bundle at build; this has to be read at runtime.
const upstream = process.env.UMAMI_URL;

const strip = ['host', 'cookie', 'connection', 'content-length', 'accept-encoding', 'x-reader-ip'];

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

	// Traefik rewrites X-Forwarded-For and X-Real-IP on the hop to Umami, so the reader's
	// address travels in a header it does not know. Stripped above, so never reader-supplied.
	const reader = request.headers.get('x-forwarded-for')?.split(',')[0].trim();
	if (reader) headers.set('x-reader-ip', reader);

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
