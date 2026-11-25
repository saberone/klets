import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/player/index.js', () => ({
	play: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../../src/api/episodes.js', () => ({
	getEpisode: vi.fn(),
}));
vi.mock('../../../src/utils/persistence.js', () => ({
	loadJson: vi.fn().mockResolvedValue(null),
	saveJson: vi.fn().mockResolvedValue(undefined),
}));

import { play } from '../../../src/player/index.js';
import { getEpisode } from '../../../src/api/episodes.js';
import { startEpisodePlayback } from '../../../src/player/start-episode.js';
import { useStore } from '../../../src/store/index.js';
import { resetStore } from '../../helpers/test-utils.js';
import { makeDetail } from '../../helpers/fixtures.js';

const mockPlay = vi.mocked(play);
const mockGetEpisode = vi.mocked(getEpisode);

describe('startEpisodePlayback', () => {
	beforeEach(() => {
		resetStore();
		mockPlay.mockReset().mockResolvedValue(true);
		mockGetEpisode.mockReset();
	});

	it('fetches the episode by slug, sets store state and plays from the given position', async () => {
		mockGetEpisode.mockResolvedValue({
			data: makeDetail({
				chapters: [{ title: 'Intro', startTime: 0, resourceUrl: null }],
			}),
		});
		const res = await startEpisodePlayback('ep-1', { startAt: 42.5 });
		expect(res.ok).toBe(true);
		expect(mockGetEpisode).toHaveBeenCalledWith('ep-1');
		expect(mockPlay).toHaveBeenCalledWith(
			'https://media.example/ep-1.mp3',
			42.5,
		);
		const s = useStore.getState();
		expect(s.currentEpisodeSlug).toBe('ep-1');
		expect(s.durationSeconds).toBe(3600);
		expect(s.chapters).toEqual([{ title: 'Intro', startTime: 0 }]);
	});

	it('resumes from history with startAt: "resume"', async () => {
		useStore.setState({
			history: [
				{
					slug: 'ep-1',
					title: 'Test Episode',
					position: 600,
					duration: 3600,
					lastPlayed: '2026-01-01T00:00:00.000Z',
					completed: false,
				},
			],
		});
		const res = await startEpisodePlayback(makeDetail(), { startAt: 'resume' });
		expect(res).toMatchObject({ ok: true, startAt: 600 });
		expect(mockPlay).toHaveBeenCalledWith(expect.any(String), 600);
		expect(mockGetEpisode).not.toHaveBeenCalled();
	});

	it('refuses an episode without audioUrl with a Dutch message and does not play', async () => {
		const res = await startEpisodePlayback(makeDetail({ audioUrl: null }));
		expect(res.ok).toBe(false);
		if (!res.ok) {
			expect(res.reason).toBe('no-audio');
			expect(res.message).toMatch(/geen audio/);
		}
		expect(mockPlay).not.toHaveBeenCalled();
		expect(useStore.getState().currentEpisodeSlug).toBeNull();
	});

	it('treats null durationSeconds as 0', async () => {
		await startEpisodePlayback(makeDetail({ durationSeconds: null }));
		expect(useStore.getState().durationSeconds).toBe(0);
	});

	it('reports not-found for a 404', async () => {
		mockGetEpisode.mockRejectedValue(
			Object.assign(new Error('Not Found'), { response: { statusCode: 404 } }),
		);
		const res = await startEpisodePlayback('nope');
		expect(res).toMatchObject({ ok: false, reason: 'not-found' });
	});

	it('resets player state when no audio backend could start', async () => {
		mockPlay.mockResolvedValue(false);
		const res = await startEpisodePlayback(makeDetail());
		expect(res).toMatchObject({ ok: false, reason: 'no-player' });
		expect(useStore.getState().currentEpisodeSlug).toBeNull();
	});
});
