import { useInput, useApp } from 'ink';
import { useNavigation } from './use-navigation.js';
import { usePlayer } from './use-player.js';
import { useStore } from '../store/index.js';
import type { InputCapture } from '../store/navigation.js';
import {
	stop as stopPlayer,
	isActive,
	seek,
	seekAbsolute,
	getPosition,
	setSpeed,
} from '../player/index.js';

const CAPTURE_STRENGTH: Record<InputCapture, number> = {
	none: 0,
	escape: 1,
	all: 2,
};

/** The stronger of two capture modes. */
export function strongestCapture(a: InputCapture, b: InputCapture): InputCapture {
	return CAPTURE_STRENGTH[a] >= CAPTURE_STRENGTH[b] ? a : b;
}

export function useGlobalKeybindings() {
	// Capture as of the last render. Combined with the live store value below:
	// the render value keeps esc captured during the keystroke that releases it
	// (handlers may run in any order), the live value covers a keystroke that
	// arrives before this hook re-rendered.
	const captureAtRender = useStore((s) => s.inputCapture);
	const { exit } = useApp();
	const { goBack, navigate, current, stack } = useNavigation();
	const player = usePlayer();

	useInput((input, key) => {
		const capture = strongestCapture(
			captureAtRender,
			useStore.getState().inputCapture,
		);
		// A text input has focus: typing "q" must type a q
		if (capture === 'all') return;

		if (input === 'q') {
			stopPlayer();
			exit();
			setTimeout(() => process.exit(0), 100);
			return;
		}

		if (key.escape && capture === 'escape') return;

		if (key.escape && stack.length > 1) {
			goBack();
			return;
		}

		if (input === '?' && current.screen !== 'help') {
			navigate('help');
			return;
		}

		// Global playback controls
		if (player.currentEpisodeSlug && isActive()) {
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
