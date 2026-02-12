import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../../src/store/index.js';
import { resetStore } from '../../helpers/test-utils.js';

describe('player store', () => {
	beforeEach(() => {
		resetStore();
	});

	it('has initial idle state', () => {
		const state = useStore.getState();
		expect(state.isPlaying).toBe(false);
		expect(state.currentEpisodeSlug).toBeNull();
		expect(state.currentEpisodeTitle).toBeNull();
		expect(state.positionSeconds).toBe(0);
		expect(state.durationSeconds).toBe(0);
	});

	it('setPlaying sets playing state', () => {
		useStore.getState().setPlaying('ep-1', 'Episode 1', 3600);
		const state = useStore.getState();
		expect(state.isPlaying).toBe(true);
		expect(state.currentEpisodeSlug).toBe('ep-1');
		expect(state.currentEpisodeTitle).toBe('Episode 1');
		expect(state.durationSeconds).toBe(3600);
		expect(state.positionSeconds).toBe(0);
	});

	it('togglePlayPause toggles isPlaying', () => {
		useStore.getState().setPlaying('ep-1', 'Episode 1', 3600);
		useStore.getState().togglePlayPause();
		expect(useStore.getState().isPlaying).toBe(false);
		useStore.getState().togglePlayPause();
		expect(useStore.getState().isPlaying).toBe(true);
	});

	it('stop resets all state', () => {
		useStore.getState().setPlaying('ep-1', 'Episode 1', 3600);
		useStore.getState().setPosition(120);
		useStore.getState().stop();
		const state = useStore.getState();
		expect(state.isPlaying).toBe(false);
		expect(state.currentEpisodeSlug).toBeNull();
		expect(state.currentEpisodeTitle).toBeNull();
		expect(state.positionSeconds).toBe(0);
		expect(state.durationSeconds).toBe(0);
	});

	it('setPosition updates position', () => {
		useStore.getState().setPlaying('ep-1', 'Episode 1', 3600);
		useStore.getState().setPosition(120);
		expect(useStore.getState().positionSeconds).toBe(120);
	});
});
