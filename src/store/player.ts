import type { StateCreator } from 'zustand';

export interface QueueItem {
	slug: string;
	title: string;
	durationSeconds: number;
}

export interface ChapterInfo {
	title: string;
	startTime: number;
}

export interface PlayerSlice {
	isPlaying: boolean;
	currentEpisodeSlug: string | null;
	currentEpisodeTitle: string | null;
	positionSeconds: number;
	durationSeconds: number;
	playbackSpeed: number;
	chapters: ChapterInfo[];
	queue: QueueItem[];
	setPlaying: (
		slug: string,
		title: string,
		durationSeconds: number,
	) => void;
	setChapters: (chapters: ChapterInfo[]) => void;
	togglePlayPause: () => void;
	stop: () => void;
	setPosition: (seconds: number) => void;
	setPlaybackSpeed: (speed: number) => void;
	addToQueue: (item: QueueItem) => void;
	removeFromQueue: (slug: string) => void;
	playNext: () => QueueItem | null;
	clearQueue: () => void;
}

export const createPlayerSlice: StateCreator<PlayerSlice> = (set, get) => ({
	isPlaying: false,
	currentEpisodeSlug: null,
	currentEpisodeTitle: null,
	positionSeconds: 0,
	durationSeconds: 0,
	playbackSpeed: 1.0,
	chapters: [],
	queue: [],

	setPlaying: (slug, title, durationSeconds) =>
		set({
			isPlaying: true,
			currentEpisodeSlug: slug,
			currentEpisodeTitle: title,
			durationSeconds,
			positionSeconds: 0,
			chapters: [],
		}),

	setChapters: (chapters) => set({ chapters }),

	togglePlayPause: () =>
		set((state) => ({ isPlaying: !state.isPlaying })),

	stop: () =>
		set({
			isPlaying: false,
			currentEpisodeSlug: null,
			currentEpisodeTitle: null,
			positionSeconds: 0,
			durationSeconds: 0,
			playbackSpeed: 1.0,
			chapters: [],
		}),

	setPosition: (seconds) => set({ positionSeconds: seconds }),

	setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

	addToQueue: (item) =>
		set((state) => {
			// Don't add duplicates
			if (state.queue.some((q) => q.slug === item.slug)) return state;
			return { queue: [...state.queue, item] };
		}),

	removeFromQueue: (slug) =>
		set((state) => ({
			queue: state.queue.filter((q) => q.slug !== slug),
		})),

	playNext: () => {
		const { queue } = get();
		if (queue.length === 0) return null;
		const next = queue[0]!;
		set({ queue: queue.slice(1) });
		return next;
	},

	clearQueue: () => set({ queue: [] }),
});
