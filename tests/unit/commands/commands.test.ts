import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';

vi.mock('../../../src/api/search.js', () => ({ search: vi.fn() }));
vi.mock('../../../src/api/episodes.js', () => ({
	getEpisodes: vi.fn(),
	getEpisode: vi.fn(),
	getTranscript: vi.fn(),
}));

import { search } from '../../../src/api/search.js';
import {
	getEpisodes,
	getEpisode,
	getTranscript,
} from '../../../src/api/episodes.js';
import { runSearch } from '../../../src/commands/search.js';
import { runTranscript } from '../../../src/commands/transcript.js';
import { preparePlay } from '../../../src/commands/play.js';
import { resolveSlug } from '../../../src/commands/resolve-episode.js';
import { describeError } from '../../../src/commands/errors.js';
import { formatSearchResults } from '../../../src/commands/format-search.js';
import {
	shouldUseColor,
	installPipeGuard,
	type Io,
} from '../../../src/commands/output.js';
import { makeDetail } from '../../helpers/fixtures.js';

function captureIo(color = false): Io & { stdout: string; stderr: string } {
	const io = {
		stdout: '',
		stderr: '',
		color,
		out: (t: string) => {
			io.stdout += t.endsWith('\n') ? t : `${t}\n`;
		},
		err: (t: string) => {
			io.stderr += t.endsWith('\n') ? t : `${t}\n`;
		},
	};
	return io;
}

const httpError = (status: number, body: unknown = {}) =>
	Object.assign(new Error(`HTTP ${status}`), {
		name: 'HTTPError',
		response: { statusCode: status, body: JSON.stringify(body) },
	});
const networkError = () =>
	Object.assign(new Error('getaddrinfo ENOTFOUND codeklets.nl'), {
		name: 'RequestError',
		code: 'ENOTFOUND',
	});

const SEARCH_DATA = {
	episodes: [
		{
			slug: 'ep-a',
			title: 'React aflevering',
			intro: null,
			seasonNumber: 2,
			episodeNumber: 10,
		},
		{
			slug: 'trailer',
			title: 'Trailer',
			intro: null,
			seasonNumber: null,
			episodeNumber: null,
		},
	],
	transcripts: [
		{
			episodeSlug: 'ep-b',
			episodeTitle: 'Next.js',
			seasonNumber: 1,
			episodeNumber: 3,
			text: 'over React components',
			speaker: 'Saber',
			startTimeMs: 2_918_500,
			endTimeMs: 2_920_000,
		},
	],
};

beforeEach(() => {
	vi.mocked(search).mockReset();
	vi.mocked(getEpisodes).mockReset();
	vi.mocked(getEpisode).mockReset();
	vi.mocked(getTranscript).mockReset();
});

describe('klets search', () => {
	it('prints episode hits (SxxEyy, title, URL) and transcript hits (title, mm:ss, speaker, text, ?t= link)', async () => {
		vi.mocked(search).mockResolvedValue({ data: SEARCH_DATA });
		const io = captureIo();
		expect(await runSearch('react', { json: false }, io)).toBe(0);
		expect(search).toHaveBeenCalledWith('react');
		const out = io.stdout;
		expect(out).toContain('S02E10  React aflevering');
		expect(out).toContain('https://codeklets.nl/afleveringen/ep-a');
		expect(out).not.toContain('S00E00');
		expect(out).toContain('Next.js  48:38');
		expect(out).toContain('Saber: over React components');
		expect(out).toContain('https://codeklets.nl/afleveringen/ep-b?t=2918');
		expect(out).not.toContain('\x1b[');
		expect(io.stderr).toBe('');
	});

	it('--json prints only the API data as pretty JSON', async () => {
		vi.mocked(search).mockResolvedValue({ data: SEARCH_DATA });
		const io = captureIo(true);
		expect(await runSearch('react', { json: true }, io)).toBe(0);
		expect(JSON.parse(io.stdout)).toEqual(SEARCH_DATA);
		expect(io.stdout).toBe(JSON.stringify(SEARCH_DATA, null, 2) + '\n');
	});

	it('says so when nothing matches', async () => {
		vi.mocked(search).mockResolvedValue({
			data: { episodes: [], transcripts: [] },
		});
		const io = captureIo();
		expect(await runSearch('zzz', { json: false }, io)).toBe(0);
		expect(io.stdout).toContain('Geen resultaten voor "zzz"');
	});

	it('network errors go to stderr in Dutch with exit 1', async () => {
		vi.mocked(search).mockRejectedValue(networkError());
		const io = captureIo();
		expect(await runSearch('react', { json: false }, io)).toBe(1);
		expect(io.stdout).toBe('');
		expect(io.stderr).toContain('Kan de CodeKlets API niet bereiken');
	});

	it('colours only when asked to', () => {
		expect(formatSearchResults('react', SEARCH_DATA, true)).toContain('\x1b[');
		expect(formatSearchResults('react', SEARCH_DATA, false)).not.toContain(
			'\x1b[',
		);
	});
});

describe('klets transcript', () => {
	const TRANSCRIPT = {
		episodeSlug: 'nieuwste',
		episodeTitle: 'Nieuwste',
		segmentCount: 1,
		segments: [
			{
				segmentIndex: 0,
				startTimeMs: 13_996,
				endTimeMs: 18_094,
				text: 'Hallo',
				speaker: 'Kishen',
			},
		],
	};

	it('resolves latest and prints plain text by default', async () => {
		vi.mocked(getEpisodes).mockResolvedValue({
			data: [{ slug: 'nieuwste' }],
			meta: {},
		} as never);
		vi.mocked(getTranscript).mockResolvedValue({ data: TRANSCRIPT });
		const io = captureIo();
		expect(await runTranscript('latest', 'text', io)).toBe(0);
		expect(getEpisodes).toHaveBeenCalledWith({ limit: 1, sort: 'newest' });
		expect(getTranscript).toHaveBeenCalledWith('nieuwste');
		expect(io.stdout).toBe('[0:00:13] Kishen: Hallo\n');
	});

	it('--vtt prints WebVTT', async () => {
		vi.mocked(getTranscript).mockResolvedValue({ data: TRANSCRIPT });
		const io = captureIo();
		expect(await runTranscript('nieuwste', 'vtt', io)).toBe(0);
		expect(
			io.stdout.startsWith(
				'WEBVTT\n\n00:00:13.996 --> 00:00:18.094\n<v Kishen>Hallo',
			),
		).toBe(true);
	});

	it('--json prints the API data only', async () => {
		vi.mocked(getTranscript).mockResolvedValue({ data: TRANSCRIPT });
		const io = captureIo();
		await runTranscript('nieuwste', 'json', io);
		expect(JSON.parse(io.stdout)).toEqual(TRANSCRIPT);
	});

	it('unknown episode: Dutch error, exit 1', async () => {
		vi.mocked(getTranscript).mockRejectedValue(
			httpError(404, { error: 'Episode not found', code: 'NOT_FOUND' }),
		);
		const io = captureIo();
		expect(await runTranscript('nope', 'text', io)).toBe(1);
		expect(io.stderr).toContain('Aflevering niet gevonden: "nope"');
		expect(io.stdout).toBe('');
	});

	it('episode without transcript: Dutch error, exit 1', async () => {
		vi.mocked(getTranscript).mockRejectedValue(
			httpError(404, { error: 'Transcript not available', code: 'NOT_FOUND' }),
		);
		const io = captureIo();
		expect(await runTranscript('ep', 'text', io)).toBe(1);
		expect(io.stderr).toContain('Geen transcript beschikbaar');
	});

	it('network error resolving latest: exit 1', async () => {
		vi.mocked(getEpisodes).mockRejectedValue(networkError());
		const io = captureIo();
		expect(await runTranscript('latest', 'text', io)).toBe(1);
		expect(io.stderr).toContain('niet bereiken');
	});
});

describe('klets play (validation before the TUI)', () => {
	it('returns the episode when it exists and has audio', async () => {
		vi.mocked(getEpisode).mockResolvedValue({
			data: makeDetail({ slug: 'ep-1' }),
		});
		const io = captureIo();
		const ep = await preparePlay('ep-1', io);
		expect(ep?.slug).toBe('ep-1');
		expect(io.stderr).toBe('');
	});

	it('resolves latest', async () => {
		vi.mocked(getEpisodes).mockResolvedValue({
			data: [{ slug: 'nieuw' }],
		} as never);
		vi.mocked(getEpisode).mockResolvedValue({
			data: makeDetail({ slug: 'nieuw' }),
		});
		expect((await preparePlay('latest', captureIo()))?.slug).toBe('nieuw');
		expect(getEpisode).toHaveBeenCalledWith('nieuw');
	});

	it('unknown slug: Dutch error, null', async () => {
		vi.mocked(getEpisode).mockRejectedValue(httpError(404));
		const io = captureIo();
		expect(await preparePlay('nope', io)).toBeNull();
		expect(io.stderr).toContain('Aflevering niet gevonden: "nope"');
	});

	it('episode without audio: Dutch error, null', async () => {
		vi.mocked(getEpisode).mockResolvedValue({
			data: makeDetail({ audioUrl: null, title: 'Stil' }),
		});
		const io = captureIo();
		expect(await preparePlay('ep-1', io)).toBeNull();
		expect(io.stderr).toContain('geen audio');
	});
});

describe('resolveSlug', () => {
	it('passes slugs through', async () => {
		expect(await resolveSlug('abc')).toBe('abc');
		expect(getEpisodes).not.toHaveBeenCalled();
	});

	it('fails in Dutch when there are no episodes', async () => {
		vi.mocked(getEpisodes).mockResolvedValue({ data: [] } as never);
		await expect(resolveSlug('latest')).rejects.toThrow(
			'Geen afleveringen gevonden',
		);
	});
});

describe('describeError', () => {
	it('maps HTTP and network errors to Dutch', () => {
		expect(describeError(httpError(404), 'Weg.')).toBe('Weg.');
		expect(describeError(httpError(500))).toContain('HTTP 500');
		expect(describeError(networkError())).toContain('ENOTFOUND');
		expect(
			describeError(
				Object.assign(new Error('Socket closed'), {
					code: 'ERR_SOCKET_CLOSED_BEFORE_CONNECTION',
				}),
			),
		).toContain('niet bereiken');
	});
});

describe('output', () => {
	it('colour only on a TTY without NO_COLOR', () => {
		expect(shouldUseColor(true, {})).toBe(true);
		expect(shouldUseColor(false, {})).toBe(false);
		expect(shouldUseColor(undefined, {})).toBe(false);
		expect(shouldUseColor(true, { NO_COLOR: '1' })).toBe(false);
		expect(shouldUseColor(true, { NO_COLOR: '' })).toBe(false);
	});

	it('the pipe guard exits 0 on EPIPE instead of crashing', () => {
		const stream = new EventEmitter();
		const exit = vi
			.spyOn(process, 'exit')
			.mockImplementation((() => undefined) as never);
		installPipeGuard(stream as never);
		stream.emit(
			'error',
			Object.assign(new Error('write EPIPE'), { code: 'EPIPE' }),
		);
		expect(exit).toHaveBeenCalledWith(0);
		exit.mockRestore();
	});
});
