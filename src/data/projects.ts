export type Project = {
	name: string;
	description: string;
	stack: string[];
} & ({ link: string; code?: string } | { link?: undefined; code: string });

export const projects: Project[] = [
	{
		name: 'dotfiles',
		stack: ['Nix', 'NixOS', 'Home Manager', 'niri'],
		description:
			'One Nix flake for NixOS and niri on two ThinkPads, plus Home Manager config for a headless host and dev containers.',
		code: 'https://github.com/unbeholdendev/dotfiles',
	},
	{
		name: 'infra',
		stack: ['Kubernetes', 'Flux', 'Talos', 'OpenTofu', 'Ansible'],
		description:
			'A homelab in Git. Ansible sets up the hosts, OpenTofu creates the VMs and Flux reconciles the Kubernetes cluster.',
		code: 'https://github.com/unbeholdendev/infra',
	},
	{
		name: 'Unbeholden Wallet',
		stack: ['TypeScript', 'React', 'Vite', 'Tailwind'],
		description:
			'A watch-only Bitcoin wallet in a browser tab. It connects to a node of your choosing and never holds a private key.',
		link: 'https://wallet.unbeholden.dev',
		code: 'https://github.com/unbeholdendev/unbeholden-wallet',
	},
	{
		name: 'Unbeholden Check',
		stack: ['TypeScript', 'Astro', 'Bun'],
		description:
			'Type a domain to see which services it rents from third parties, with the evidence, and the open source software that could replace each one.',
		link: 'https://check.unbeholden.dev',
		code: 'https://github.com/unbeholdendev/sovereignty-scorecard',
	},
	{
		name: 'AI PR reviewer',
		stack: ['TypeScript', 'Bun', 'Hono'],
		description:
			'A code review bot for Forgejo. It reviews pull requests with Pi and answers questions in the comments.',
		code: 'https://github.com/unbeholdendev/reviewer',
	},
	{
		name: 'Unbeholden',
		stack: ['TypeScript', 'Astro', 'Tailwind', 'Bun'],
		description: 'This site.',
		link: 'https://unbeholden.dev',
		code: 'https://github.com/unbeholdendev/unbeholden.dev',
	},
	{
		name: 'Skorpik',
		stack: ['TypeScript', 'React', 'Astro', 'Hono', 'Postgres'],
		description: 'An office prediction league on real matches, with no betting.',
		link: 'https://skorpik.app',
	},
	{
		name: 'Lightning payments for UCP',
		stack: ['BOLT12', 'Lightning Address'],
		description:
			'A spec for paying over Lightning in the Universal Commerce Protocol. It defines three handlers: BOLT12, Lightning Address and an invoice API. The payment preimage proves each payment.',
		code: 'https://github.com/Musqet/ucp-lightning-spec',
	},
	{
		name: 'unbeholden-lnurl',
		stack: ['Go', 'LND', 'gRPC'],
		description:
			'A small Lightning Address server in Go. Payments to you@yourdomain are invoiced by your own LND node.',
		code: 'https://github.com/unbeholdendev/unbeholden-lnurl',
	},
	{
		name: 'lnrecc',
		stack: ['Rust', 'Tokio', 'LND'],
		description:
			'Recurring Lightning payments from your LND node, on a cron schedule. Pocket money, a subscription or a regular donation.',
		code: 'https://github.com/unbeholdendev/lnrecc',
	},
	{
		name: 'lofextra',
		stack: ['TypeScript', 'React', 'Astro', 'SQLite'],
		description:
			'A local-first expense tracker. Data stays on your device in SQLite and syncs encrypted between devices, with a 12-word phrase in place of an account.',
		link: 'https://lofextra.unbeholden.dev',
		code: 'https://github.com/unbeholdendev/lofextra',
	},
];

// Committed, not fetched at build, per ADR-0001. Add one with `bun scripts/og-image.ts <link>`.
const images = import.meta.glob<{ default: ImageMetadata }>('../assets/work/*', { eager: true });

export const screenshot = (link: string) => {
	const { hostname, pathname } = new URL(link);
	const name = hostname + pathname.replace(/\/$/, '').replaceAll('/', '.');
	return Object.entries(images).find(([path]) => path.includes(`/${name}.`))?.[1].default;
};
