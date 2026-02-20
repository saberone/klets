import { useInput, useApp } from 'ink';
import { useNavigation } from './use-navigation.js';
import { usePlayer } from './use-player.js';
import {
	stop as stopPlayer,
	isActive,
	seek,
	seekAbsolute,
	getPosition,
	setSpeed,
} from '../player/index.js';

export function useGlobalKeybindings() {
	const { exit } = useApp();
	const { goBack, navigate, current, stack } = useNavigation();
	const player = usePlayer();

	useInput((input, key) => {
		// Don't intercept q/backspace on the search screen (needs text input)
		const onSearch = current.screen === 'search';

		if (input === 'q' && !onSearch) {
			stopPlayer();
			exit();
			setTimeout(() => process.exit(0), 100);
			return;
		}

		if (key.escape && stack.length > 1) {
			goBack();
			return;
		}

		if (input === '?' && !onSearch && current.screen !== 'help') {
			navigate('help');
			return;
		}

		// Global playback controls — skip on search (text input)
		if (!onSearch && player.currentEpisodeSlug && isActive()) {
			if (input === ' ') {
				stopPlayer();
				player.stop();
				return;
			}

			if (input === '<') {
				seek(-15);
				return;
			}

			if (input === '>') {
				seek(15);
				return;
			}

			if (input === '-' || input === '+') {
				const speeds = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
				const curIdx = speeds.indexOf(player.playbackSpeed);
				const idx = curIdx === -1 ? 2 : curIdx;
				const newIdx =
					input === '+'
						? Math.min(idx + 1, speeds.length - 1)
						: Math.max(idx - 1, 0);
				const newSpeed = speeds[newIdx]!;
				player.setPlaybackSpeed(newSpeed);
				setSpeed(newSpeed);
				return;
			}

			if (input === '[' && player.chapters.length > 0) {
				const pos = getPosition();
				const prev = [...player.chapters]
					.reverse()
					.find((c) => c.startTime < pos - 3);
				if (prev) seekAbsolute(prev.startTime);
				return;
			}

			if (input === ']' && player.chapters.length > 0) {
				const pos = getPosition();
				const next = player.chapters.find(
					(c) => c.startTime > pos + 1,
				);
				if (next) seekAbsolute(next.startTime);
				return;
			}
		}
	});
}
