import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';
import { PersonsListScreen } from '../../src/screens/persons-list.js';
import { resetStore } from '../helpers/test-utils.js';

vi.mock('../../src/api/persons.js', () => ({
	getPersons: vi.fn(),
}));

import { getPersons } from '../../src/api/persons.js';
const mockGetPersons = vi.mocked(getPersons);

describe('PersonsListScreen', () => {
	beforeEach(() => {
		resetStore();
		mockGetPersons.mockReset();
	});

	it('shows loading state', () => {
		mockGetPersons.mockReturnValue(new Promise(() => {}));
		const { lastFrame } = render(<PersonsListScreen />);
		expect(lastFrame()).toContain('Personen laden...');
	});

	it('shows empty state', async () => {
		mockGetPersons.mockResolvedValue({
			data: [],
			meta: { page: 1, limit: 50, total: 0, totalPages: 0, hasMore: false },
		});
		const { lastFrame } = render(<PersonsListScreen />);
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('Geen personen gevonden.');
		});
	});

	it('renders persons', async () => {
		mockGetPersons.mockResolvedValue({
			data: [
				{
					id: 1,
					name: 'Saber',
					jobTitle: 'Developer',
					tagline: null,
					imageUrl: null,
					socialLinks: { website: null, linkedin: null, bluesky: null, github: null },
					episodeCount: 10,
				},
			],
			meta: { page: 1, limit: 50, total: 1, totalPages: 1, hasMore: false },
		});
		const { lastFrame } = render(<PersonsListScreen />);
		await vi.waitFor(() => {
			expect(lastFrame()).toContain('Saber');
			expect(lastFrame()).toContain('Developer');
		});
	});
});
