import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { SearchScreen } from '../../src/screens/search.js';
import { resetStore, delay, INK_INIT_DELAY } from '../helpers/test-utils.js';

vi.mock('../../src/api/search.js', () => ({
	search: vi.fn(),
}));

import { search } from '../../src/api/search.js';
const mockSearch = vi.mocked(search);

async function typeAndSubmit(
	stdin: { write: (data: string) => void },
	text: string,
) {
	for (const char of text) {
		stdin.write(char);
		await delay(10);
	}
	await delay(20);
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
		await delay(INK_INIT_DELAY);
		await typeAndSubmit(stdin, 're');
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('Geen afleveringen');
		});
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
						matchType: 'title',
					},
				],
				transcripts: [],
			},
		});
		const { stdin, lastFrame } = render(<SearchScreen />);
		await delay(INK_INIT_DELAY);
		await typeAndSubmit(stdin, 're');
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
		await delay(INK_INIT_DELAY);
		await typeAndSubmit(stdin, 'xyz');
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('Geen afleveringen');
		});
	});
});
