import { writeFile } from 'node:fs/promises';

for (const link of process.argv.slice(2)) {
	const html = await (await fetch(link)).text();
	const tag = html.match(/<meta[^>]*og:image["'][^>]*>/)?.[0];
	const src = tag?.match(/content=["']([^"']+)/)?.[1];
	if (!src) {
		console.error(`${link}: no og:image`);
		continue;
	}
	const res = await fetch(new URL(src, link));
	if (!res.ok) {
		console.error(`${link}: ${src} answered ${res.status}`);
		continue;
	}
	const ext = res.headers.get('content-type')?.split('/')[1] ?? 'png';
	await writeFile(`src/assets/built/${new URL(link).hostname}.${ext}`, Buffer.from(await res.arrayBuffer()));
}
