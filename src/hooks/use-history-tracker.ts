import { useEffect, useRef } from 'react';
import { usePlayer } from './use-player.js';
import { useStore } from '../store/index.js';
import { isActive, getPosition, play } from '../player/index.js';

export function useHistoryTracker() {
	const {
		currentEpisodeSlug,
		currentEpisodeTitle,
		durationSeconds,
		playNext,
		setPlaying,
		stop,
	} = usePlayer();
	const updateHistory = useStore((s) => s.updateHistory);
	const markCompleted = useStore((s) => s.markCompleted);
	const prevSlugRef = useRef<string | null>(null);

	useEffect(() => {
		if (!currentEpisodeSlug || !currentEpisodeTitle) {
			if (prevSlugRef.current) {
				prevSlugRef.current = null;
			}
			return;
		}

		prevSlugRef.current = currentEpisodeSlug;

		const timer = setInterval(() => {
			const pos = getPosition();

			if (!isActive()) {
				// Playback ended — try auto-advance from queue
				const next = playNext();
				if (next) {
					setPlaying(next.slug, next.title, next.durationSeconds);
					play(next.slug);
				} else {
					stop();
				}
				return;
			}

			if (pos > 0) {
				updateHistory(
					currentEpisodeSlug,
					currentEpisodeTitle,
					pos,
					durationSeconds,
				);

				// Mark as completed if within last 60 seconds
				if (durationSeconds > 0 && pos >= durationSeconds - 60) {
					markCompleted(currentEpisodeSlug);
				}
			}
		}, 10_000);

		return () => clearInterval(timer);
	}, [currentEpisodeSlug, currentEpisodeTitle, durationSeconds]);
}
