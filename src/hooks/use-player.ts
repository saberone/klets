import { useStore } from '../store/index.js';

export function usePlayer() {
	const isPlaying = useStore((s) => s.isPlaying);
	const currentEpisodeSlug = useStore((s) => s.currentEpisodeSlug);
	const currentEpisodeTitle = useStore((s) => s.currentEpisodeTitle);
	const positionSeconds = useStore((s) => s.positionSeconds);
	const durationSeconds = useStore((s) => s.durationSeconds);
	const setPlaying = useStore((s) => s.setPlaying);
	const togglePlayPause = useStore((s) => s.togglePlayPause);
	const stop = useStore((s) => s.stop);
	const setPosition = useStore((s) => s.setPosition);

	return {
		isPlaying,
		currentEpisodeSlug,
		currentEpisodeTitle,
		positionSeconds,
		durationSeconds,
		setPlaying,
		togglePlayPause,
		stop,
		setPosition,
	};
}
