import { useEffect, useRef } from 'react';
import { usePlayer } from './use-player.js';
import { useStore } from '../store/index.js';
import { isActive, getPosition } from '../player/index.js';
import { startEpisodePlayback } from '../player/start-episode.js';

export const HISTORY_TICK_MS = 10_000;

export function useHistoryTracker() {
	const { currentEpisodeSlug, currentEpisodeTitle, durationSeconds } =
		usePlayer();
	const updateHistory = useStore((s) => s.updateHistory);
	const markCompleted = useStore((s) => s.markCompleted);
	// True while a queue auto-advance is fetching/starting the next episode.
	// Until it resolves, currentEpisodeSlug is unchanged and isActive() is
	// false, so without this guard the next tick would pop another item.
	const advancingRef = useRef(false);

	useEffect(() => {
		if (!currentEpisodeSlug || !currentEpisodeTitle) return;

		const timer = setInterval(() => {
			if (advancingRef.current) return;
			const pos = getPosition();

			if (!isActive()) {
				// Playback ended — try auto-advance from queue
				const { playNext, stop, requeueFront } = useStore.getState();
				const next = playNext();
				if (!next) {
					stop();
					return;
				}
				advancingRef.current = true;
				startEpisodePlayback(next.slug)
					.then((res) => {
						if (!res.ok) {
							// Keep the item: back to the front of the queue, then stop.
							// Stopping ends this interval, so there is no retry loop.
							requeueFront(next);
							stop();
						}
					})
					.finally(() => {
						advancingRef.current = false;
					});
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
		}, HISTORY_TICK_MS);

		return () => clearInterval(timer);
	}, [currentEpisodeSlug, currentEpisodeTitle, durationSeconds]);
}
