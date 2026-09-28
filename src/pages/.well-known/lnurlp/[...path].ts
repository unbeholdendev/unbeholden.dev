import type { APIRoute } from 'astro';

export const prerender = false;

// import.meta.env freezes the value into the bundle at build; this has to be read at runtime.
const upstream = process.env.LNURL_URL;

export const GET: APIRoute = async ({ url }) => {
	if (!upstream) return new Response(null, { status: 404 });
	try {
		// The raw pathname, not the decoded param, so an encoded `../` stays inside the name.
		return await fetch(`${upstream}${url.pathname}${url.search}`, {
			// fetch unzips the body but keeps the upstream's content-encoding, which would reach the wallet.
			headers: { 'accept-encoding': 'identity' },
			signal: AbortSignal.timeout(10000),
		});
	} catch (error) {
		console.error('lnurl proxy:', error);
		return new Response(null, { status: 502 });
	}
};
