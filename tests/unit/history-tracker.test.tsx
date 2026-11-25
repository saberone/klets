import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from 'ink-testing-library';

vi.mock('../../src/player/index.js', () => ({
	isActive: vi.fn().mockReturnValue(false),
	getPosition: vi.fn().mockReturnValue(0),
}));
vi.mock('../../src/player/start-episode.js', () => ({
	startEpisodePlayback: vi.fn(),
}));
vi.mock('../../src/utils/persistence.js', () => ({
	loadJson: vi.fn().mockResolvedValue(null),
	saveJson: vi.fn().mockResolvedValue(undefined),
}));

import { startEpisodePlayback } from '../../src/player/start-episode.js';
import {
	useHistoryTracker,
	HISTORY_TICK_MS,
} from '../../src/hooks/use-history-tracker.js';
import { useStore } from '../../src/store/index.js';
import { resetStore } from '../helpers/test-utils.js';

const item = (slug: string) => ({
	slug,
	title: slug,
	durationSeconds: 100,
	audioUrl: `https://media.example/${slug}.mp3`,
});

function Tracker() {
	useHistoryTracker();
	return null;
}

const mockStart = vi.mocked(startEpisodePlayback);

describe('queue auto-advance', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		resetStore();
		mockStart.mockReset();
		// An episode was playing and has ended (isActive() is false)
		useStore.setState({
			currentEpisodeSlug: 'current',
			currentEpisodeTitle: 'Current',
			durationSeconds: 100,
			queue: [item('a'), item('b'), item('c')],
		});
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it('a second tick during a pending fetch does not pop another item', async () => {
		let resolveStart!: (v: unknown) => void;
		mockStart.mockReturnValue(new Promise((r) => (resolveStart = r)) as never);
		render(<Tracker />);

		await vi.advanceTimersByTimeAsync(HISTORY_TICK_MS);
		expect(mockStart).toHaveBeenCalledTimes(1);
		expect(mockStart).toHaveBeenCalledWith('a');
		expect(useStore.getState().queue.map((q) => q.slug)).toEqual(['b', 'c']);

		// Fetch still pending: further ticks must not advance again
		await vi.advanceTimersByTimeAsync(HISTORY_TICK_MS * 3);
		expect(mockStart).toHaveBeenCalledTimes(1);
		expect(useStore.getState().queue.map((q) => q.slug)).toEqual(['b', 'c']);

		resolveStart({ ok: true, startAt: 0, episode: {} });
		await vi.advanceTimersByTimeAsync(0);
		expect(useStore.getState().queue.map((q) => q.slug)).toEqual(['b', 'c']);
	});

	it('a failed start puts the item back at the front of the queue and stops', async () => {
		mockStart.mockResolvedValue({
			ok: false,
			reason: 'error',
			message: 'kapot',
		});
		render(<Tracker />);
		await vi.advanceTimersByTimeAsync(HISTORY_TICK_MS);
		expect(mockStart).toHaveBeenCalledWith('a');
		const s = useStore.getState();
		expect(s.queue.map((q) => q.slug)).toEqual(['a', 'b', 'c']);
		expect(s.currentEpisodeSlug).toBeNull();

		// Stopped: no retry loop draining the queue
		await vi.advanceTimersByTimeAsync(HISTORY_TICK_MS * 3);
		expect(mockStart).toHaveBeenCalledTimes(1);
	});

	it('stops when the queue is empty', async () => {
		useStore.setState({ queue: [] });
		render(<Tracker />);
		await vi.advanceTimersByTimeAsync(HISTORY_TICK_MS);
		expect(mockStart).not.toHaveBeenCalled();
		expect(useStore.getState().currentEpisodeSlug).toBeNull();
	});
});

describe('requeueFront', () => {
	beforeEach(() => resetStore());
	it('puts the item first without duplicating it', () => {
		useStore.setState({ queue: [item('b'), item('a')] });
		useStore.getState().requeueFront(item('a'));
		expect(useStore.getState().queue.map((q) => q.slug)).toEqual(['a', 'b']);
	});
});
