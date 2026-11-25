import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';

vi.mock('../../src/api/episodes.js', () => ({
	getTranscript: vi.fn(),
	getEpisode: vi.fn(),
}));
vi.mock('../../src/player/index.js', () => ({
	play: vi.fn().mockResolvedValue(true),
	isActive: vi.fn().mockReturnValue(false),
	getPosition: vi.fn().mockReturnValue(0),
	seekAbsolute: vi.fn(),
}));
vi.mock('../../src/utils/clipboard.js', () => ({
	copyToClipboard: vi.fn().mockResolvedValue('copied'),
}));

import { getTranscript } from '../../src/api/episodes.js';
import { copyToClipboard } from '../../src/utils/clipboard.js';
import { TranscriptScreen } from '../../src/screens/transcript.js';
import { useStore } from '../../src/store/index.js';
import {
	resetStore,
	waitForInputReady,
	waitForFrame,
	delay,
} from '../helpers/test-utils.js';

const SEGMENTS = [
	{
		segmentIndex: 0,
		startTimeMs: 500,
		endTimeMs: 4000,
		text: 'Welkom bij CodeKlets',
		speaker: 'Kishen Simbhoedatpanday',
	},
	{
		segmentIndex: 1,
		startTimeMs: 4000,
		endTimeMs: 9000,
		text: 'Vandaag over Café React',
		speaker: 'Saber Karmous',
	},
	{
		segmentIndex: 2,
		startTimeMs: 75_250,
		endTimeMs: 80_000,
		text: 'Een gast vertelt over react hooks',
		speaker: 'Gast',
	},
];

function open() {
	vi.mocked(getTranscript).mockResolvedValue({
		data: {
			episodeSlug: 'ep-1',
			episodeTitle: 'Aflevering 1',
			segmentCount: 3,
			segments: SEGMENTS,
		},
	});
	useStore.setState({
		stack: [
			{ screen: 'home' },
			{ screen: 'transcript', params: { slug: 'ep-1', title: 'Aflevering 1' } },
		],
	});
	return render(<TranscriptScreen />);
}

describe('TranscriptScreen share links', () => {
	beforeEach(() => {
		resetStore();
		vi.mocked(copyToClipboard).mockReset().mockResolvedValue('copied');
	});

	it('y copies a link to the selected segment with floored t and confirms', async () => {
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Welkom bij CodeKlets');
		await waitForInputReady(stdin);
		stdin.write('j');
		await waitForFrame(lastFrame, '› 0:04');
		stdin.write('j');
		await waitForFrame(lastFrame, '› 1:15');
		await delay(10);
		stdin.write('y');
		await vi.waitFor(() =>
			expect(copyToClipboard).toHaveBeenCalledWith(
				'https://codeklets.nl/afleveringen/ep-1?t=75',
			),
		);
		await waitForFrame(lastFrame, 'Link gekopieerd');
	});

	it('omits t for a segment that starts within the first second', async () => {
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Welkom bij CodeKlets');
		await waitForInputReady(stdin);
		stdin.write('y');
		await vi.waitFor(() =>
			expect(copyToClipboard).toHaveBeenCalledWith(
				'https://codeklets.nl/afleveringen/ep-1',
			),
		);
	});

	it('shows the URL itself when copying fails', async () => {
		vi.mocked(copyToClipboard).mockResolvedValue('failed');
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Welkom bij CodeKlets');
		await waitForInputReady(stdin);
		stdin.write('j');
		await waitForFrame(lastFrame, '› 0:04');
		await delay(10);
		stdin.write('y');
		await waitForFrame(lastFrame, 'https://codeklets.nl/afleveringen/ep-1?t=4');
		expect(lastFrame()).not.toContain('Link gekopieerd');
	});

	it('an unconfirmed OSC 52 copy shows the URL without claiming failure', async () => {
		vi.mocked(copyToClipboard).mockResolvedValue('sent');
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Welkom bij CodeKlets');
		await waitForInputReady(stdin);
		stdin.write('y');
		await waitForFrame(lastFrame, 'klembord van je terminal');
		expect(lastFrame()).toContain('https://codeklets.nl/afleveringen/ep-1');
		expect(lastFrame()).not.toContain('niet gelukt');
	});

	it('the confirmation disappears after about 2 seconds', async () => {
		const { lastFrame, stdin } = open();
		await waitForFrame(lastFrame, 'Welkom bij CodeKlets');
		await waitForInputReady(stdin);
		stdin.write('y');
		await waitForFrame(lastFrame, 'Link gekopieerd');
		await delay(2200);
		expect(lastFrame()).not.toContain('Link gekopieerd');
	});
});
