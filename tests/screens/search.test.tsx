import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { SearchScreen } from '../../src/screens/search.js';
import {
	resetStore,
	delay,
	INK_INIT_DELAY,
	waitForInputReady,
	waitForFrame,
} from '../helpers/test-utils.js';

vi.mock('../../src/api/search.js', () => ({
	search: vi.fn(),
}));

vi.mock('../../src/api/search-suggestions.js', () => ({
	getSearchSuggestions: vi.fn().mockResolvedValue({ data: [] }),
}));

import { search } from '../../src/api/search.js';
const mockSearch = vi.mocked(search);

async function typeAndSubmit(
	stdin: { write: (data: string) => void; listenerCount(e: string): number },
	lastFrame: () => string | undefined,
	text: string,
) {
	await waitForInputReady(stdin);
	let typed = '';
	for (const char of text) {
		stdin.write(char);
		typed += char;
		// Wait until the keystroke is rendered so the next handler sees fresh state
		await waitForFrame(lastFrame, `Zoeken: ${typed}`);
	}
	await delay(10);
	stdin.write('\r');
}

describe('SearchScreen', () => {
	beforeEach(() => {
		resetStore();
		mockSearch.mockReset();
	});

	it('shows initial input state', async () => {
		const { lastFrame } = render(<SearchScreen />);
		await delay(INK_INIT_DELAY);
		expect(lastFrame()).toContain('Zoeken:');
		expect(lastFrame()).toContain('minimaal 2 tekens');
	});

	it('accepts input and submits on enter', async () => {
		mockSearch.mockResolvedValue({
			data: { episodes: [], transcripts: [] },
		});
		const { stdin, lastFrame } = render(<SearchScreen />);
		await typeAndSubmit(stdin, lastFrame, 're');
		await waitForFrame(lastFrame, 'Geen afleveringen');
	});

	it('shows results', async () => {
		mockSearch.mockResolvedValue({
			data: {
				episodes: [
					{
						slug: 'ep-1',
						title: 'React Basics',
						intro: null,
						seasonNumber: 1,
						episodeNumber: 1,
					},
				],
				transcripts: [],
			},
		});
		const { stdin, lastFrame } = render(<SearchScreen />);
		await typeAndSubmit(stdin, lastFrame, 're');
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('React Basics');
			expect(lastFrame()).toContain('Afleveringen (1)');
		});
	});

	it('shows empty results message', async () => {
		mockSearch.mockResolvedValue({
			data: { episodes: [], transcripts: [] },
		});
		const { stdin, lastFrame } = render(<SearchScreen />);
		await typeAndSubmit(stdin, lastFrame, 'xyz');
		await waitForFrame(lastFrame, 'Geen afleveringen');
	});
});
