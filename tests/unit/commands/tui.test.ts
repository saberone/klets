import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('ink', async (orig) => ({
	...(await orig<typeof import('ink')>()),
	render: vi.fn(),
}));
vi.mock('../../../src/app.js', () => ({ App: () => null }));
vi.mock('../../../src/player/index.js', () => ({
	initBackend: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../src/audio/jingle.js', () => ({ playJingle: vi.fn() }));
vi.mock('../../../src/player/start-episode.js', () => ({
	startEpisodePlayback: vi.fn().mockResolvedValue({ ok: true, startAt: 0 }),
}));
vi.mock('../../../src/utils/persistence.js', () => ({
	loadJson: vi
		.fn()
		.mockResolvedValue([
			{
				slug: 'ep-1',
				title: 'T',
				position: 300,
				duration: 3600,
				lastPlayed: '2026-01-01T00:00:00Z',
				completed: false,
			},
		]),
	saveJson: vi.fn(),
}));

import { render } from 'ink';
import { playJingle } from '../../../src/audio/jingle.js';
import { startEpisodePlayback } from '../../../src/player/start-episode.js';
import { startTui } from '../../../src/commands/tui.js';
import { useStore } from '../../../src/store/index.js';
import { resetStore } from '../../helpers/test-utils.js';
import { makeDetail } from '../../helpers/fixtures.js';

describe('startTui', () => {
	beforeEach(() => {
		resetStore();
		vi.mocked(render).mockClear();
		vi.mocked(playJingle).mockClear();
	});

	it('plain TUI: plays the jingle and renders home', async () => {
		await startTui();
		expect(playJingle).toHaveBeenCalled();
		expect(render).toHaveBeenCalled();
		expect(useStore.getState().stack).toEqual([{ screen: 'home' }]);
	});

	it('play: opens the detail screen, loads history and resumes playback', async () => {
		const episode = makeDetail({ slug: 'ep-1' });
		await startTui({ episode });
		expect(useStore.getState().stack).toEqual([
			{ screen: 'home' },
			{ screen: 'episode-detail', params: { slug: 'ep-1' } },
		]);
		expect(useStore.getState().history[0]!.position).toBe(300);
		expect(startEpisodePlayback).toHaveBeenCalledWith(episode, {
			startAt: 'resume',
		});
		expect(playJingle).not.toHaveBeenCalled();
	});

	it('play: a playback failure is handed to the detail screen as playError', async () => {
		vi.mocked(startEpisodePlayback).mockResolvedValueOnce({
			ok: false,
			reason: 'no-player',
			message: 'Afspelen mislukt: geen geschikte audiospeler gevonden.',
		});
		await startTui({ episode: makeDetail({ slug: 'ep-1' }) });
		const top = useStore.getState().stack[1]!;
		expect(top.screen).toBe('episode-detail');
		expect(top.params).toEqual({
			slug: 'ep-1',
			playError: 'Afspelen mislukt: geen geschikte audiospeler gevonden.',
		});
	});
});
