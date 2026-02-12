import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { EpisodesListScreen } from '../../src/screens/episodes-list.js';
import { resetStore } from '../helpers/test-utils.js';

vi.mock('../../src/api/episodes.js', () => ({
	getEpisodes: vi.fn(),
}));

vi.mock('../../src/api/seasons.js', () => ({
	getSeasons: vi.fn().mockResolvedValue({ data: [] }),
}));

import { getEpisodes } from '../../src/api/episodes.js';
const mockGetEpisodes = vi.mocked(getEpisodes);

describe('EpisodesListScreen', () => {
	beforeEach(() => {
		resetStore();
		mockGetEpisodes.mockReset();
	});

	it('shows loading state', () => {
		mockGetEpisodes.mockReturnValue(new Promise(() => {}));
		const { lastFrame } = render(<EpisodesListScreen />);
		expect(lastFrame()).toContain('Afleveringen laden...');
	});

	it('shows empty state', async () => {
		mockGetEpisodes.mockResolvedValue({
			data: [],
			meta: { page: 1, limit: 15, total: 0, totalPages: 0, hasMore: false },
		});
		const { lastFrame } = render(<EpisodesListScreen />);
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('Geen afleveringen gevonden.');
		});
	});

	it('renders episodes', async () => {
		mockGetEpisodes.mockResolvedValue({
			data: [
				{
					slug: 'ep-1',
					title: 'Test Episode',
					intro: null,
					seasonNumber: 1,
					episodeNumber: 1,
					durationSeconds: 3600,
					publishedAt: '2024-01-01T00:00:00Z',
					artworkUrl: null,
					tags: [],
					persons: [],
					hasTranscript: false,
					chapterCount: 0,
				},
			],
			meta: { page: 1, limit: 15, total: 1, totalPages: 1, hasMore: false },
		});
		const { lastFrame } = render(<EpisodesListScreen />);
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('Test Episode');
		});
	});
});
