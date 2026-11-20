/** The address the request reached the reverse proxy from. */
export function clientIp(request: Request, clientAddress: string) {
	// Traefik appends the peer it saw. Every entry before it is whatever the client sent.
	return request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim() || clientAddress;
}
