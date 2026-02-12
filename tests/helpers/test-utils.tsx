import { useStore } from '../../src/store/index.js';

export function resetStore() {
	useStore.setState({
		stack: [{ screen: 'home' }],
		isPlaying: false,
		currentEpisodeSlug: null,
		currentEpisodeTitle: null,
		positionSeconds: 0,
		durationSeconds: 0,
		_cache: new Map(),
	});
}

/**
 * Ink's stdin handler needs a tick to initialize after render().
 * Without this, the first character written is dropped.
 */
export const INK_INIT_DELAY = 50;

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
