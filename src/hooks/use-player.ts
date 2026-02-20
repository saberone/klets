import { useStore } from '../store/index.js';

export function usePlayer() {
	const isPlaying = useStore((s) => s.isPlaying);
	const currentEpisodeSlug = useStore((s) => s.currentEpisodeSlug);
	const currentEpisodeTitle = useStore((s) => s.currentEpisodeTitle);
	const positionSeconds = useStore((s) => s.positionSeconds);
	const durationSeconds = useStore((s) => s.durationSeconds);
	const playbackSpeed = useStore((s) => s.playbackSpeed);
	const chapters = useStore((s) => s.chapters);
	const queue = useStore((s) => s.queue);
	const setPlaying = useStore((s) => s.setPlaying);
	const togglePlayPause = useStore((s) => s.togglePlayPause);
	const stop = useStore((s) => s.stop);
	const setPosition = useStore((s) => s.setPosition);
	const setPlaybackSpeed = useStore((s) => s.setPlaybackSpeed);
	const setChapters = useStore((s) => s.setChapters);
	const addToQueue = useStore((s) => s.addToQueue);
	const removeFromQueue = useStore((s) => s.removeFromQueue);
	const playNext = useStore((s) => s.playNext);
	const clearQueue = useStore((s) => s.clearQueue);

	return {
		isPlaying,
		currentEpisodeSlug,
		currentEpisodeTitle,
		positionSeconds,
		durationSeconds,
		playbackSpeed,
		chapters,
		queue,
		setPlaying,
		togglePlayPause,
		stop,
		setPosition,
		setPlaybackSpeed,
		setChapters,
		addToQueue,
		removeFromQueue,
		playNext,
		clearQueue,
	};
}
