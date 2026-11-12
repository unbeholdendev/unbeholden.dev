import type { push } from './ntfy';
import type { Admission } from './rate-limit';

type Notify = typeof push;

export const MAX_MESSAGE = 3500;
const PUSH_BYTES = 3700;

// A bot fills the hidden field. Tell it yes and send nothing.
const filledByBot = (form: FormData) => String(form.get('website') ?? '') !== '';

// ntfy caps a message at 4096 bytes, and 3500 characters outside ASCII can pass that. The
// log holds every message whole, so the push can be cut short.
export function truncateForPush(text: string) {
	const bytes = new TextEncoder().encode(text);
	if (bytes.length <= PUSH_BYTES) return text;
	const cut = new TextDecoder().decode(bytes.slice(0, PUSH_BYTES)).replace(/\uFFFD$/, '');
	return `${cut}\n\n[Cut short. The whole message is in the server log.]`;
}

export interface Contact {
	state: 'sent' | 'failed' | 'limited';
	name: string;
	email: string;
	message: string;
}

export async function sendContact(form: FormData, admit: () => Admission, notify: Notify): Promise<Contact> {
	const name = String(form.get('name') ?? '')
		.trim()
		.slice(0, 100);
	const email = String(form.get('email') ?? '')
		.trim()
		.slice(0, 254);
	const message = String(form.get('message') ?? '').trim();
	const fields = { name, email, message };

	if (filledByBot(form)) return { state: 'sent', ...fields };
	if (!message || message.length > MAX_MESSAGE) return { state: 'failed', ...fields };

	const admitted = admit();
	console.log(JSON.stringify({ contact: { name, email, message, admitted } }));
	if (admitted === 'first-over') {
		void notify({
			title: 'Contact form rate-limited',
			message: 'Ten messages this hour. The rest are in the server log.',
			tags: ['warning'],
		});
	}
	if (admitted !== 'ok') return { state: 'limited', ...fields };

	const replyable = /^[^\s@?&]+@[^\s@?&]+$/.test(email);
	const sent = await notify({
		title: name ? `Message from ${name}` : 'Message',
		message: email ? `${truncateForPush(message)}\n\n${email}` : truncateForPush(message),
		tags: ['speech_balloon'],
		actions: replyable
			? [
					{
						action: 'view',
						label: 'Reply',
						url: `mailto:${email}?subject=${encodeURIComponent('Your message on unbeholden.dev')}`,
					},
				]
			: undefined,
	});
	return { state: sent ? 'sent' : 'failed', ...fields };
}

export async function subscribe(form: FormData, notify: Notify) {
	const email = String(form.get('email') ?? '').trim();
	if (filledByBot(form)) return { ok: true, email };

	const upstream = process.env.LISTMONK_URL;
	const list = Number(process.env.LISTMONK_LIST_ID);
	const user = process.env.LISTMONK_API_USER;
	const token = process.env.LISTMONK_API_TOKEN;
	if (!email || !upstream || !list || !user || !token) return { ok: false, email };

	try {
		const sent = await fetch(`${upstream}/api/subscribers`, {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Basic ${btoa(`${user}:${token}`)}`,
			},
			// The opt-in mail greets by name, and the form asks for an address and nothing else.
			body: JSON.stringify({
				email,
				name: email.split('@')[0],
				status: 'enabled',
				lists: [list],
			}),
			signal: AbortSignal.timeout(5000),
		});
		// Started and not waited for, so the reader's answer never waits on my phone. A conflict
		// is someone re-subscribing, so it is not news, and a bot tripping the honeypot above
		// never reaches this branch at all.
		if (sent.ok) void notify({ title: 'New subscriber', message: email, tags: ['envelope'] });
		// Already on the list is not a failure, and saying it was would disclose who is on it.
		return { ok: sent.ok || sent.status === 409, email };
	} catch {
		return { ok: false, email };
	}
}
