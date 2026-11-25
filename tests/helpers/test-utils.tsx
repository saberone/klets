import { vi, expect } from 'vitest';
import { useStore } from '../../src/store/index.js';

export function resetStore() {
	useStore.setState({
		stack: [{ screen: 'home' }],
		isPlaying: false,
		currentEpisodeSlug: null,
		currentEpisodeTitle: null,
		positionSeconds: 0,
		durationSeconds: 0,
		playbackSpeed: 1,
		chapters: [],
		queue: [],
		history: [],
		historyLoaded: false,
		favorites: [],
		favoritesLoaded: false,
		inputCapture: 'none',
		_cache: new Map(),
	});
}

/**
 * Ink's stdin handler needs a tick to initialize after render().
 * Without this, the first character written is dropped.
 * Prefer waitForInputReady(), which waits for the listener deterministically.
 */
export const INK_INIT_DELAY = 50;

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface TestStdin {
	listenerCount(event: string): number;
}

/** Waits until Ink has attached its stdin listener, so no keystroke is dropped. */
export async function waitForInputReady(stdin: TestStdin): Promise<void> {
	await vi.waitFor(
		() => {
			expect(stdin.listenerCount('readable')).toBeGreaterThan(0);
		},
		{ timeout: 5000 },
	);
	// Let pending effects (useInput subscriptions) flush.
	await delay(10);
}

/** Waits until the last rendered frame contains `text`. */
export async function waitForFrame(
	lastFrame: () => string | undefined,
	text: string,
): Promise<void> {
	await vi.waitFor(
		() => {
			expect(lastFrame() ?? '').toContain(text);
		},
		{ timeout: 5000 },
	);
}
