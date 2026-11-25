import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';

// A local server stands in for the API; the real client configuration is used.
const ESC = '\u001b';
const BEL = '\u0007';
const OSC52 = `${ESC}]52;c;aGFsbG8=${BEL}`;
const C1 = '\u009b';

let server: Server;
const requested: string[] = [];

function body(path: string): unknown {
	if (path.startsWith('/api/easter-egg/quotes')) {
		return {
			characters: [{ name: `Host${C1}`, quotes: [`Quote${OSC52}`] }],
			timestamp: '',
			signature: '',
		};
	}
	return {
		data: {
			slug: 'ep-1',
			title: `Aflevering${OSC52} een`,
			persons: [{ name: `Spreker${C1}31m` }],
			socialLinks: { [`web${ESC}site`]: 'https://example.com' },
		},
	};
}

beforeAll(async () => {
	server = createServer((req, res) => {
		requested.push(req.url ?? '');
		if (req.url?.endsWith('/geen-json')) {
			res.setHeader('content-type', 'application/json');
			res.end(`${OSC52}{`);
			return;
		}
		if (req.url?.endsWith('/serverfout')) {
			res.writeHead(500, `Fout${C1}31m\u0085`);
			res.end();
			return;
		}
		res.setHeader('content-type', 'application/json');
		res.end(JSON.stringify(body(req.url ?? '')));
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const { port } = server.address() as AddressInfo;
	vi.stubEnv('CODEKLETS_API_URL', `http://127.0.0.1:${port}/api/v1`);
	vi.resetModules();
});

afterAll(async () => {
	vi.unstubAllEnvs();
	await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('API client', () => {
	it('removes control characters from every string in a response', async () => {
		const { api } = await import('../../../src/api/client.js');
		const res = await api.get('episodes/ep-1').json<{
			data: {
				title: string;
				persons: { name: string }[];
				socialLinks: Record<string, string>;
			};
		}>();
		expect(res.data.title).toBe('Aflevering]52;c;aGFsbG8= een');
		expect(res.data.persons[0]!.name).toBe('Spreker31m');
		expect(res.data.socialLinks).toEqual({ website: 'https://example.com' });
		// eslint-disable-next-line no-control-regex
		expect(JSON.stringify(res)).not.toMatch(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/);
	});

	it('removes control characters from quotes', async () => {
		const { getRandomQuote } = await import('../../../src/api/quotes.js');
		expect(await getRandomQuote()).toEqual({
			text: 'Quote]52;c;aGFsbG8=',
			attribution: 'Host',
		});
	});

	it('encodes slugs as a single path segment', async () => {
		const { getEpisode, getTranscript } = await import(
			'../../../src/api/episodes.js'
		);
		const { getTopic } = await import('../../../src/api/topics.js');
		const { getPerson } = await import('../../../src/api/persons.js');
		requested.length = 0;
		await getEpisode('a/../b?c#d');
		await getTranscript('a b');
		await getTopic('x/y').catch(() => undefined);
		await getPerson(7).catch(() => undefined);
		expect(requested).toEqual([
			'/api/v1/episodes/a%2F..%2Fb%3Fc%23d',
			'/api/v1/episodes/a%20b/transcript',
			'/api/v1/topics/x%2Fy',
			'/api/v1/persons/7',
		]);
	});

	it('removes control characters from error messages that quote the response', async () => {
		const { api } = await import('../../../src/api/client.js');
		const errors = await Promise.all([
			api.get('geen-json').json().catch((e: Error) => e),
			api.get('serverfout', { retry: { limit: 0 } }).json().catch((e: Error) => e),
		]);
		for (const err of errors) {
			expect(err).toBeInstanceOf(Error);
			// eslint-disable-next-line no-control-regex
			expect((err as Error).message).not.toMatch(/[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/);
		}
		expect((errors[0] as Error).message).toContain('Ongeldig JSON-antwoord');
		expect((errors[1] as Error).message).toContain('Fout31m');
	});
});
