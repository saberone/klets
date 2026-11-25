import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';

vi.mock('node:child_process', () => ({
	spawn: vi.fn(() => ({ on: vi.fn(), unref: vi.fn() })),
}));
vi.mock('../../src/api/persons.js', () => ({
	getPerson: vi.fn(),
}));

import { spawn } from 'node:child_process';
import { getPerson } from '../../src/api/persons.js';
import { PersonDetailScreen } from '../../src/screens/person-detail.js';
import { useStore } from '../../src/store/index.js';
import { resetStore, waitForInputReady, waitForFrame, delay } from '../helpers/test-utils.js';
import type { PersonDetail } from '../../src/api/types.js';

function person(socialLinks: Record<string, string | null>): PersonDetail {
	return {
		id: 7,
		name: 'Test Persoon',
		jobTitle: null,
		tagline: null,
		socialLinks,
		episodeCount: 0,
		episodes: [],
	} as unknown as PersonDetail;
}

describe('PersonDetailScreen links', () => {
	beforeEach(() => {
		resetStore();
		vi.mocked(spawn).mockClear();
		useStore.setState({
			stack: [{ screen: 'home' }, { screen: 'person-detail', params: { id: 7 } }],
		});
	});

	it('opens a web link', async () => {
		vi.mocked(getPerson).mockResolvedValue({
			data: person({ website: 'https://example.com/me' }),
		});
		const { lastFrame, stdin } = render(<PersonDetailScreen />);
		await waitForFrame(lastFrame, 'Test Persoon');
		await waitForInputReady(stdin);
		stdin.write('o');
		await vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(1));
	});

	it('does not open other links and shows a Dutch message', async () => {
		vi.mocked(getPerson).mockResolvedValue({
			data: person({ email: 'mailto:a@example.com' }),
		});
		const { lastFrame, stdin } = render(<PersonDetailScreen />);
		await waitForFrame(lastFrame, 'Test Persoon');
		await waitForInputReady(stdin);
		await delay(10);
		stdin.write('o');
		await waitForFrame(lastFrame, 'kan niet worden geopend');
		expect(spawn).not.toHaveBeenCalled();
	});
});
