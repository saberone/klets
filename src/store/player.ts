import type { StateCreator } from 'zustand';

export interface PlayerSlice {
	isPlaying: boolean;
	currentEpisodeSlug: string | null;
	currentEpisodeTitle: string | null;
	positionSeconds: number;
	durationSeconds: number;
	setPlaying: (
		slug: string,
		title: string,
		durationSeconds: number,
	) => void;
	togglePlayPause: () => void;
	stop: () => void;
	setPosition: (seconds: number) => void;
}

export const createPlayerSlice: StateCreator<PlayerSlice> = (set) => ({
	isPlaying: false,
	currentEpisodeSlug: null,
	currentEpisodeTitle: null,
	positionSeconds: 0,
	durationSeconds: 0,

	setPlaying: (slug, title, durationSeconds) =>
		set({
			isPlaying: true,
			currentEpisodeSlug: slug,
			currentEpisodeTitle: title,
			durationSeconds,
			positionSeconds: 0,
		}),

	togglePlayPause: () =>
		set((state) => ({ isPlaying: !state.isPlaying })),

	stop: () =>
		set({
			isPlaying: false,
			currentEpisodeSlug: null,
			currentEpisodeTitle: null,
			positionSeconds: 0,
			durationSeconds: 0,
		}),

	setPosition: (seconds) => set({ positionSeconds: seconds }),
});
