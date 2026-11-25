import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from 'ink-testing-library';
vi.mock('../../src/player/start-episode.js', () => ({
	startEpisodePlayback: vi.fn().mockResolvedValue({ ok: true, startAt: 754, episode: {} }),
}));

import { HomeScreen } from '../../src/screens/home.js';
import { startEpisodePlayback } from '../../src/player/start-episode.js';
import type { HistoryEntry } from '../../src/store/history.js';

function historyEntry(over: Partial<HistoryEntry> = {}): HistoryEntry {
	return {
		slug: 'ep-resume',
		title: 'Halve aflevering',
		position: 754,
		duration: 3600,
		lastPlayed: '2026-11-20T10:00:00.000Z',
		completed: false,
		...over,
	};
}
import { useStore } from '../../src/store/index.js';
import {
	resetStore,
	delay,
	INK_INIT_DELAY,
	waitForInputReady,
	waitForFrame,
} from '../helpers/test-utils.js';

describe('HomeScreen', () => {
	beforeEach(() => {
		resetStore();
	});

	it('renders menu items', async () => {
		const { lastFrame } = render(<HomeScreen />);
		await delay(INK_INIT_DELAY);
		const frame = lastFrame()!;
		expect(frame).toContain('Afleveringen');
		expect(frame).toContain('Onderwerpen');
		expect(frame).toContain('Personen');
		expect(frame).toContain('Zoeken');
	});

	it('navigates on enter', async () => {
		const { stdin } = render(<HomeScreen />);
		await waitForInputReady(stdin);
		stdin.write('\r');
		await vi.waitFor(() => {
			expect(useStore.getState().stack).toHaveLength(2);
		});
		expect(useStore.getState().stack[1]!.screen).toBe('episodes-list');
	});

	it('j moves selection down', async () => {
		const { stdin, lastFrame } = render(<HomeScreen />);
		await waitForInputReady(stdin);
		stdin.write('j');
		// Wait for the selection to render before pressing enter
		await waitForFrame(lastFrame, 'Beste momenten uit de podcast');
		await delay(10);
		stdin.write('\r');
		await vi.waitFor(() => {
			expect(useStore.getState().stack).toHaveLength(2);
		});
		expect(useStore.getState().stack[1]!.screen).toBe('moments');
	});

	it('offers Geschiedenis in the menu', async () => {
		const { lastFrame } = render(<HomeScreen />);
		await waitForFrame(lastFrame, 'Geschiedenis');
	});

	it('shows "Verder luisteren" for an unfinished latest entry and resumes on enter', async () => {
		vi.mocked(startEpisodePlayback).mockClear();
		useStore.setState({ history: [historyEntry()] });
		const { lastFrame, stdin } = render(<HomeScreen />);
		await waitForFrame(lastFrame, 'Verder luisteren');
		expect(lastFrame()).toContain('Halve aflevering');
		expect(lastFrame()).toContain('12:34 / 1:00:00');
		await waitForInputReady(stdin);
		stdin.write('\r');
		await vi.waitFor(() => {
			expect(startEpisodePlayback).toHaveBeenCalledWith('ep-resume', { startAt: 754 });
		});
		// Enter on the resume row does not navigate
		expect(useStore.getState().stack).toHaveLength(1);
	});

	it('resume row shifts the menu: j then enter opens Afleveringen', async () => {
		useStore.setState({ history: [historyEntry()] });
		const { lastFrame, stdin } = render(<HomeScreen />);
		await waitForFrame(lastFrame, 'Verder luisteren');
		await waitForInputReady(stdin);
		stdin.write('j');
		await waitForFrame(lastFrame, 'Bekijk alle afleveringen');
		await delay(10);
		stdin.write('\r');
		await vi.waitFor(() => expect(useStore.getState().stack).toHaveLength(2));
		expect(useStore.getState().stack[1]!.screen).toBe('episodes-list');
	});

	it('hides the resume row when the latest entry is completed or barely started', async () => {
		useStore.setState({
			history: [
				historyEntry({ slug: 'done', completed: true, lastPlayed: '2026-11-21T10:00:00.000Z' }),
				historyEntry({ slug: 'older', lastPlayed: '2026-11-01T10:00:00.000Z' }),
			],
		});
		const first = render(<HomeScreen />);
		await waitForFrame(first.lastFrame, 'Afleveringen');
		expect(first.lastFrame()).not.toContain('Verder luisteren');
		first.unmount();

		useStore.setState({ history: [historyEntry({ position: 8 })] });
		const second = render(<HomeScreen />);
		await waitForFrame(second.lastFrame, 'Afleveringen');
		expect(second.lastFrame()).not.toContain('Verder luisteren');
	});

	it('hides "Verder luisteren" while that episode is the one playing', async () => {
		useStore.setState({
			history: [historyEntry()],
			currentEpisodeSlug: 'ep-resume',
			currentEpisodeTitle: 'Halve aflevering',
		});
		const { lastFrame } = render(<HomeScreen />);
		await waitForFrame(lastFrame, 'Bekijk alle afleveringen');
		expect(lastFrame()).not.toContain('Verder luisteren');
	});

	it('keeps the selection on the same menu item when the resume row appears or disappears', async () => {
		useStore.setState({ history: [historyEntry()] });
		const { lastFrame, stdin } = render(<HomeScreen />);
		await waitForFrame(lastFrame, 'Verder luisteren');
		await waitForInputReady(stdin);
		stdin.write('j');
		await waitForFrame(lastFrame, 'Bekijk alle afleveringen');
		stdin.write('j');
		await waitForFrame(lastFrame, 'Beste momenten uit de podcast');

		// Starts playing → row disappears; Hoogtepunten stays selected
		useStore.setState({ currentEpisodeSlug: 'ep-resume', currentEpisodeTitle: 'Halve aflevering' });
		await vi.waitFor(() => expect(lastFrame()).not.toContain('Verder luisteren'));
		expect(lastFrame()).toContain('Beste momenten uit de podcast');

		// Stops → row reappears; still Hoogtepunten
		useStore.setState({ currentEpisodeSlug: null, currentEpisodeTitle: null });
		await waitForFrame(lastFrame, 'Verder luisteren');
		expect(lastFrame()).toContain('Beste momenten uit de podcast');
		await delay(10);
		stdin.write('\r');
		await vi.waitFor(() => expect(useStore.getState().stack).toHaveLength(2));
		expect(useStore.getState().stack[1]!.screen).toBe('moments');
	});

	it('falls back to the first menu item when the selected resume row disappears', async () => {
		useStore.setState({ history: [historyEntry()] });
		const { lastFrame, stdin } = render(<HomeScreen />);
		await waitForFrame(lastFrame, 'Verder luisteren');
		await waitForInputReady(stdin);
		useStore.setState({ currentEpisodeSlug: 'ep-resume', currentEpisodeTitle: 'Halve aflevering' });
		await vi.waitFor(() => expect(lastFrame()).not.toContain('Verder luisteren'));
		expect(lastFrame()).toContain('Bekijk alle afleveringen');
		await delay(10);
		stdin.write('\r');
		await vi.waitFor(() => expect(useStore.getState().stack).toHaveLength(2));
		expect(useStore.getState().stack[1]!.screen).toBe('episodes-list');
	});
});
