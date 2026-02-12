import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { TopicsListScreen } from '../../src/screens/topics-list.js';
import { resetStore } from '../helpers/test-utils.js';

vi.mock('../../src/api/topics.js', () => ({
	getTopics: vi.fn(),
}));

import { getTopics } from '../../src/api/topics.js';
const mockGetTopics = vi.mocked(getTopics);

describe('TopicsListScreen', () => {
	beforeEach(() => {
		resetStore();
		mockGetTopics.mockReset();
	});

	it('shows loading state', () => {
		mockGetTopics.mockReturnValue(new Promise(() => {})); // never resolves
		const { lastFrame } = render(<TopicsListScreen />);
		expect(lastFrame()).toContain('Onderwerpen laden...');
	});

	it('shows empty state', async () => {
		mockGetTopics.mockResolvedValue({ data: [], meta: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false } });
		const { lastFrame } = render(<TopicsListScreen />);
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('Geen onderwerpen gevonden.');
		});
	});

	it('renders topics', async () => {
		mockGetTopics.mockResolvedValue({
			data: [
				{ name: 'React', slug: 'react', episodeCount: 5 },
				{ name: 'Node.js', slug: 'nodejs', episodeCount: 3 },
			],
			meta: { page: 1, limit: 50, total: 2, totalPages: 1, hasMore: false },
		});
		const { lastFrame } = render(<TopicsListScreen />);
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('React');
			expect(lastFrame()).toContain('Node.js');
		});
	});
});
