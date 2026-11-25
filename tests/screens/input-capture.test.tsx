import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';

vi.mock('../../src/api/episodes.js', () => ({
	getTranscript: vi.fn(),
	getEpisode: vi.fn(),
}));
vi.mock('../../src/api/search.js', () => ({ search: vi.fn() }));
vi.mock('../../src/api/search-suggestions.js', () => ({
	getSearchSuggestions: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock('../../src/player/index.js', () => ({
	play: vi.fn().mockResolvedValue(true),
	stop: vi.fn(),
	isActive: vi.fn().mockReturnValue(false),
	getPosition: vi.fn().mockReturnValue(0),
	seek: vi.fn(),
	seekAbsolute: vi.fn(),
	setSpeed: vi.fn(),
}));
vi.mock('../../src/utils/clipboard.js', () => ({
	copyToClipboard: vi.fn().mockResolvedValue('copied'),
}));

import { getTranscript } from '../../src/api/episodes.js';
import { isActive } from '../../src/player/index.js';
import {
	useGlobalKeybindings,
	strongestCapture,
} from '../../src/hooks/use-keybindings.js';
import { TranscriptScreen } from '../../src/screens/transcript.js';
import { SearchScreen } from '../../src/screens/search.js';
import { useStore } from '../../src/store/index.js';
import {
	resetStore,
	waitForInputReady,
	waitForFrame,
	delay,
} from '../helpers/test-utils.js';

const ESC = '\x1b';

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
		text: 'Een gast over react hooks',
		speaker: 'Gast',
	},
	{
		segmentIndex: 3,
		startTimeMs: 90_000,
		endTimeMs: 95_000,
		text: 'Tot de volgende keer',
		speaker: 'Saber Karmous',
	},
];

/** The global keybindings mounted next to a screen, like in App. */
function WithGlobals({ children }: { children: React.ReactNode }) {
	useGlobalKeybindings();
	return <>{children}</>;
}

async function type(stdin: { write: (s: string) => void }, text: string) {
	for (const ch of text) {
		stdin.write(ch);
		await delay(15);
	}
}

let exitSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	resetStore();
	// A leaked "q" would quit the test runner
	exitSpy = vi
		.spyOn(process, 'exit')
		.mockImplementation((() => undefined) as never);
});
afterEach(() => {
	exitSpy.mockRestore();
});

async function openTranscript() {
	vi.mocked(getTranscript).mockResolvedValue({
		data: {
			episodeSlug: 'ep-1',
			episodeTitle: 'Aflevering 1',
			segmentCount: 4,
			segments: SEGMENTS,
		},
	});
	useStore.setState({
		stack: [
			{ screen: 'home' },
			{ screen: 'transcript', params: { slug: 'ep-1', title: 'Aflevering 1' } },
		],
	});
	const r = render(
		<WithGlobals>
			<TranscriptScreen />
		</WithGlobals>,
	);
	await waitForFrame(r.lastFrame, 'Welkom bij CodeKlets');
	await waitForInputReady(r.stdin);
	return r;
}

async function search(
	r: {
		stdin: { write: (s: string) => void };
		lastFrame: () => string | undefined;
	},
	query: string,
) {
	r.stdin.write('/');
	await waitForFrame(r.lastFrame, 'annuleer');
	await type(r.stdin, query);
	await waitForFrame(r.lastFrame, `/ ${query}`);
	await delay(10);
	r.stdin.write('\r');
}

describe('strongestCapture', () => {
	it('picks the stronger mode', () => {
		expect(strongestCapture('none', 'all')).toBe('all');
		expect(strongestCapture('escape', 'none')).toBe('escape');
		expect(strongestCapture('all', 'escape')).toBe('all');
	});
});

describe('transcript search', () => {
	it('/ opens the input and captures global keys: q and ? are typed, not executed', async () => {
		const { stdin, lastFrame } = await openTranscript();
		stdin.write('/');
		await waitForFrame(lastFrame, 'annuleer');
		expect(useStore.getState().inputCapture).toBe('all');
		await type(stdin, 'q?');
		await waitForFrame(lastFrame, '/ q?');
		await delay(150);
		expect(exitSpy).not.toHaveBeenCalled();
		expect(useStore.getState().stack.map((s) => s.screen)).toEqual([
			'home',
			'transcript',
		]);
	});

	it('enter jumps to the first match, n/N cycle with wrap-around and a counter', async () => {
		const r = await openTranscript();
		await search(r, 'REACT');
		await waitForFrame(r.lastFrame, '1/2');
		expect(r.lastFrame()).toContain('› 0:04');
		expect(useStore.getState().inputCapture).toBe('escape');
		r.stdin.write('n');
		await waitForFrame(r.lastFrame, '2/2');
		expect(r.lastFrame()).toContain('› 1:15');
		r.stdin.write('n');
		await waitForFrame(r.lastFrame, '1/2');
		r.stdin.write('N');
		await waitForFrame(r.lastFrame, '2/2');
	});

	it('matching ignores diacritics and also looks at the speaker', async () => {
		const r = await openTranscript();
		await search(r, 'cafe');
		await waitForFrame(r.lastFrame, '1/1');
		expect(r.lastFrame()).toContain('› 0:04');

		r.stdin.write(ESC);
		await vi.waitFor(() => expect(r.lastFrame()).not.toContain('1/1'));
		await delay(20);
		await search(r, 'kishen');
		await waitForFrame(r.lastFrame, '1/1');
		expect(r.lastFrame()).toContain('› 0:00');
	});

	it('enter searches from the selected segment', async () => {
		const r = await openTranscript();
		r.stdin.write('j');
		await waitForFrame(r.lastFrame, '› 0:04');
		r.stdin.write('j');
		await waitForFrame(r.lastFrame, '› 1:15');
		await search(r, 'saber');
		// Segment 1 (0:04) is before the cursor, so the first hit is segment 3 (1:30)
		await waitForFrame(r.lastFrame, '2/2');
		expect(r.lastFrame()).toContain('› 1:30');
	});

	it('no matches shows "Geen resultaten"', async () => {
		const r = await openTranscript();
		await search(r, 'zzz');
		await waitForFrame(r.lastFrame, 'Geen resultaten');
	});

	it('esc while typing clears the search and stays on the screen', async () => {
		const { stdin, lastFrame } = await openTranscript();
		stdin.write('/');
		await waitForFrame(lastFrame, 'annuleer');
		await type(stdin, 'rea');
		stdin.write(ESC);
		await vi.waitFor(() => expect(lastFrame()).not.toContain('annuleer'));
		await delay(30);
		expect(useStore.getState().stack).toHaveLength(2);
		expect(useStore.getState().inputCapture).toBe('none');
	});

	it('esc with an active search clears it; a second esc goes back', async () => {
		const r = await openTranscript();
		await search(r, 'react');
		await waitForFrame(r.lastFrame, '1/2');

		r.stdin.write(ESC);
		await vi.waitFor(() => expect(r.lastFrame()).not.toContain('1/2'));
		await delay(30);
		expect(useStore.getState().stack).toHaveLength(2);

		r.stdin.write(ESC);
		await vi.waitFor(() => expect(useStore.getState().stack).toHaveLength(1));
	});

	it('jumping to a match pauses following', async () => {
		vi.mocked(isActive).mockReturnValue(true);
		try {
			useStore.setState({
				currentEpisodeSlug: 'ep-1',
				currentEpisodeTitle: 'Aflevering 1',
			});
			const r = await openTranscript();
			await waitForFrame(r.lastFrame, '● volgt');
			await search(r, 'react');
			await waitForFrame(r.lastFrame, '○ gepauzeerd');
			expect(r.lastFrame()).toContain('1/2');
		} finally {
			vi.mocked(isActive).mockReturnValue(false);
		}
	});

	it('without a search, q quits as before (global keys still work)', async () => {
		const { stdin } = await openTranscript();
		stdin.write('q');
		await vi.waitFor(() => expect(exitSpy).toHaveBeenCalledWith(0), {
			timeout: 1000,
		});
	});
});

describe('search screen uses the same mechanism', () => {
	it('typing q types a q and does not quit; esc goes back', async () => {
		useStore.setState({ stack: [{ screen: 'home' }, { screen: 'search' }] });
		const { stdin, lastFrame } = render(
			<WithGlobals>
				<SearchScreen />
			</WithGlobals>,
		);
		await waitForInputReady(stdin);
		await vi.waitFor(() =>
			expect(useStore.getState().inputCapture).toBe('all'),
		);
		await type(stdin, 'q?');
		await waitForFrame(lastFrame, 'Zoeken: q?');
		await delay(150);
		expect(exitSpy).not.toHaveBeenCalled();
		expect(useStore.getState().stack).toHaveLength(2);
		stdin.write(ESC);
		await vi.waitFor(() => expect(useStore.getState().stack).toHaveLength(1));
	});
});
