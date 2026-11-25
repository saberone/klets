import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'ink-testing-library';

vi.mock('../../src/utils/persistence.js', () => ({
	loadJson: vi.fn().mockResolvedValue(null),
	saveJson: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../src/player/start-episode.js', () => ({
	startEpisodePlayback: vi
		.fn()
		.mockResolvedValue({ ok: true, startAt: 120, episode: {} }),
}));

import { saveJson } from '../../src/utils/persistence.js';
import { startEpisodePlayback } from '../../src/player/start-episode.js';
import {
	HistoryScreen,
	formatHistoryProgress,
} from '../../src/screens/history.js';
import { useStore } from '../../src/store/index.js';
import type { HistoryEntry } from '../../src/store/history.js';
import {
	resetStore,
	waitForInputReady,
	waitForFrame,
	delay,
} from '../helpers/test-utils.js';

function entry(over: Partial<HistoryEntry>): HistoryEntry {
	return {
		slug: 'ep',
		title: 'Aflevering',
		position: 120,
		duration: 3600,
		lastPlayed: '2026-01-01T10:00:00.000Z',
		completed: false,
		...over,
	};
}

const HISTORY = [
	entry({
		slug: 'oud',
		title: 'Oude aflevering',
		lastPlayed: '2026-01-01T10:00:00.000Z',
		completed: true,
	}),
	entry({
		slug: 'nieuw',
		title: 'Nieuwe aflevering',
		lastPlayed: '2026-03-01T10:00:00.000Z',
	}),
];

describe('formatHistoryProgress', () => {
	it('shows position / duration, position only, or ✓ when completed', () => {
		expect(
			formatHistoryProgress(entry({ position: 754, duration: 3600 })),
		).toBe('12:34 / 1:00:00');
		expect(formatHistoryProgress(entry({ position: 754, duration: 0 }))).toBe(
			'12:34',
		);
		expect(formatHistoryProgress(entry({ completed: true }))).toBe(
			'✓ beluisterd',
		);
	});
});

describe('HistoryScreen', () => {
	beforeEach(() => {
		resetStore();
		vi.mocked(startEpisodePlayback).mockClear();
		vi.mocked(saveJson).mockClear();
	});

	it('shows a Dutch empty state', async () => {
		const { lastFrame } = render(<HistoryScreen />);
		await waitForFrame(lastFrame, 'Nog niets beluisterd');
	});

	it('lists entries by lastPlayed descending with progress', async () => {
		useStore.setState({ history: HISTORY });
		const { lastFrame } = render(<HistoryScreen />);
		await waitForFrame(lastFrame, 'Nieuwe aflevering');
		const frame = lastFrame()!;
		expect(frame.indexOf('Nieuwe aflevering')).toBeLessThan(
			frame.indexOf('Oude aflevering'),
		);
		expect(frame).toContain('2:00 / 1:00:00');
		expect(frame).toContain('✓');
	});

	it('enter opens the episode detail of the selected entry', async () => {
		useStore.setState({ history: HISTORY });
		const { lastFrame, stdin } = render(<HistoryScreen />);
		await waitForFrame(lastFrame, 'Nieuwe aflevering');
		await waitForInputReady(stdin);
		stdin.write('\r');
		await vi.waitFor(() => expect(useStore.getState().stack).toHaveLength(2));
		expect(useStore.getState().stack[1]).toEqual({
			screen: 'episode-detail',
			params: { slug: 'nieuw' },
		});
	});

	it('p resumes the selected entry', async () => {
		useStore.setState({ history: HISTORY });
		const { lastFrame, stdin } = render(<HistoryScreen />);
		await waitForFrame(lastFrame, 'Nieuwe aflevering');
		await waitForInputReady(stdin);
		stdin.write('p');
		await vi.waitFor(() =>
			expect(startEpisodePlayback).toHaveBeenCalledWith('nieuw', {
				startAt: 'resume',
			}),
		);
		await waitForFrame(lastFrame, 'Hervat bij 2:00');
	});

	it('x removes the selected entry and persists', async () => {
		useStore.setState({ history: HISTORY });
		const { lastFrame, stdin } = render(<HistoryScreen />);
		await waitForFrame(lastFrame, 'Nieuwe aflevering');
		await waitForInputReady(stdin);
		stdin.write('x');
		await vi.waitFor(() => expect(useStore.getState().history).toHaveLength(1));
		expect(useStore.getState().history[0]!.slug).toBe('oud');
		expect(saveJson).toHaveBeenCalled();
		await delay(10);
		expect(lastFrame()).not.toContain('Nieuwe aflevering');
	});

	it('uses singular/plural correctly in the count', async () => {
		useStore.setState({ history: [HISTORY[0]!] });
		const one = render(<HistoryScreen />);
		await waitForFrame(one.lastFrame, '1 aflevering');
		expect(one.lastFrame()).not.toContain('1 afleveringen');
		one.unmount();
		useStore.setState({ history: HISTORY });
		const two = render(<HistoryScreen />);
		await waitForFrame(two.lastFrame, '2 afleveringen');
	});
});
