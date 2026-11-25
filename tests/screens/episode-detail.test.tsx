import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';

vi.mock('../../src/api/episodes.js', () => ({
	getEpisode: vi.fn(),
}));
vi.mock('../../src/player/index.js', () => ({
	play: vi.fn().mockResolvedValue(true),
	stop: vi.fn(),
	isActive: vi.fn().mockReturnValue(false),
}));
vi.mock('../../src/utils/persistence.js', () => ({
	loadJson: vi.fn().mockResolvedValue(null),
	saveJson: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('node:child_process', () => ({
	spawn: vi.fn(() => ({ on: vi.fn(), unref: vi.fn() })),
}));
vi.mock('../../src/utils/clipboard.js', () => ({
	copyToClipboard: vi.fn().mockResolvedValue('copied'),
}));

import { spawn } from 'node:child_process';
import { getEpisode } from '../../src/api/episodes.js';
import { copyToClipboard } from '../../src/utils/clipboard.js';
import { play } from '../../src/player/index.js';
import { EpisodeDetailScreen } from '../../src/screens/episode-detail.js';
import { useStore } from '../../src/store/index.js';
import {
	resetStore,
	waitForInputReady,
	waitForFrame,
	delay,
} from '../helpers/test-utils.js';
import { makeDetail } from '../helpers/fixtures.js';

const mockGetEpisode = vi.mocked(getEpisode);

function open(slug = 'ep-1') {
	useStore.setState({
		stack: [{ screen: 'home' }, { screen: 'episode-detail', params: { slug } }],
	});
	return render(<EpisodeDetailScreen />);
}

describe('EpisodeDetailScreen', () => {
	beforeEach(() => {
		resetStore();
		mockGetEpisode.mockReset();
		vi.mocked(play).mockClear();
	});

	it('shows a TRAILER badge and no S00E00 for a trailer without numbers', async () => {
		mockGetEpisode.mockResolvedValue({
			data: makeDetail({
				slug: 'trailer',
				title: 'Trailer seizoen 5',
				episodeType: 'trailer',
				seasonNumber: null,
				episodeNumber: null,
				durationSeconds: null,
				publishedAt: null,
			}),
		});
		const { lastFrame } = open('trailer');
		await waitForFrame(lastFrame, 'Trailer seizoen 5');
		expect(lastFrame()).toContain('TRAILER');
		expect(lastFrame()).not.toMatch(/S\d\dE\d\d/);
	});

	it('says in Dutch that an episode without audio cannot be played', async () => {
		mockGetEpisode.mockResolvedValue({ data: makeDetail({ audioUrl: null }) });
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Test Episode');
		expect(lastFrame()).toContain('geen audio');
		await waitForInputReady(stdin);
		stdin.write('p');
		await waitForFrame(lastFrame, 'kan niet worden afgespeeld');
		expect(play).not.toHaveBeenCalled();
		expect(useStore.getState().currentEpisodeSlug).toBeNull();
	});

	it('p starts playback through the shared helper', async () => {
		mockGetEpisode.mockResolvedValue({ data: makeDetail() });
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Test Episode');
		await waitForInputReady(stdin);
		stdin.write('p');
		await vi.waitFor(() =>
			expect(play).toHaveBeenCalledWith('https://media.example/ep-1.mp3', 0),
		);
		expect(useStore.getState().currentEpisodeSlug).toBe('ep-1');
	});

	it('shows the person name with a link and tolerates links without url', async () => {
		mockGetEpisode.mockResolvedValue({
			data: makeDetail({
				links: [
					{
						title: 'Boek',
						url: 'https://example.com/boek',
						personName: 'Saber Karmous',
					},
					{ title: 'Zonder url', url: null, personName: null },
				],
			}),
		});
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Links');
		await waitForInputReady(stdin);
		stdin.write('l');
		await waitForFrame(lastFrame, 'Saber Karmous');
		expect(lastFrame()).toContain('https://example.com/boek');
		expect(lastFrame()).toContain('Zonder url');
		expect(lastFrame()).not.toContain('null');
	});

	it('y shares the episode link (no t) outside the chapters tab', async () => {
		vi.mocked(copyToClipboard).mockClear();
		mockGetEpisode.mockResolvedValue({ data: makeDetail() });
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Test Episode');
		await waitForInputReady(stdin);
		stdin.write('y');
		await vi.waitFor(() =>
			expect(copyToClipboard).toHaveBeenCalledWith(
				'https://codeklets.nl/afleveringen/ep-1',
			),
		);
		await waitForFrame(lastFrame, 'Link gekopieerd');
	});

	it('y on the chapters tab shares the selected chapter with t', async () => {
		vi.mocked(copyToClipboard).mockClear();
		mockGetEpisode.mockResolvedValue({
			data: makeDetail({
				chapters: [
					{ title: 'Intro', startTime: 0, resourceUrl: null },
					{ title: 'Hoofdstuk twee', startTime: 312.7, resourceUrl: null },
				],
			}),
		});
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Hoofdstukken');
		await waitForInputReady(stdin);
		stdin.write('l');
		await waitForFrame(lastFrame, 'Hoofdstuk twee');
		await delay(20);
		stdin.write('y');
		await vi.waitFor(() =>
			expect(copyToClipboard).toHaveBeenCalledWith(
				'https://codeklets.nl/afleveringen/ep-1',
			),
		);
		stdin.write('j');
		await waitForFrame(lastFrame, '▸ 5:12');
		await delay(10);
		stdin.write('y');
		await vi.waitFor(() =>
			expect(copyToClipboard).toHaveBeenLastCalledWith(
				'https://codeklets.nl/afleveringen/ep-1?t=312',
			),
		);
	});

	it('shows a playError param (from klets play) as a message and clears it', async () => {
		mockGetEpisode.mockResolvedValue({ data: makeDetail() });
		useStore.setState({
			stack: [
				{ screen: 'home' },
				{
					screen: 'episode-detail',
					params: { slug: 'ep-1', playError: 'Afspelen mislukt: geen geschikte audiospeler gevonden.' },
				},
			],
		});
		const { lastFrame } = render(<EpisodeDetailScreen />);
		await waitForFrame(lastFrame, 'geen geschikte audiospeler');
		expect(useStore.getState().stack[1]!.params).toEqual({ slug: 'ep-1' });
	});

	it('o opens web links only and says so in Dutch for other links', async () => {
		vi.mocked(spawn).mockClear();
		mockGetEpisode.mockResolvedValue({
			data: makeDetail({
				links: [
					{ title: 'Bestand', url: 'ftp://example.com/x', personName: null },
					{ title: 'Website', url: 'https://example.com/site', personName: null },
				],
			}),
		});
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Links');
		await waitForInputReady(stdin);
		stdin.write('l');
		await waitForFrame(lastFrame, 'Bestand');
		await delay(20);
		stdin.write('o');
		await waitForFrame(lastFrame, 'kan niet worden geopend');
		expect(spawn).not.toHaveBeenCalled();
		stdin.write('j');
		await delay(20);
		stdin.write('o');
		await vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(1));
		const args = vi.mocked(spawn).mock.calls[0]![1] as string[];
		expect(args[args.length - 1]).toBe('https://example.com/site');
	});
});
