import type { APIRoute } from 'astro';

// A prerendered file is served without the CORS header, and web clients need it.
export const prerender = false;

export const GET: APIRoute = () =>
	Response.json(
		{ names: { jakub: 'eb80a3c3a6da79639e59af199c7e490e48d9cbcb6f33caffa43980cd1ad37e28' } },
		{ headers: { 'access-control-allow-origin': '*' } },
	);
