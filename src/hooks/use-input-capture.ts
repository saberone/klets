import { useLayoutEffect } from 'react';
import { useStore } from '../store/index.js';
import type { InputCapture } from '../store/navigation.js';

/**
 * Declares which global keybindings this screen takes over (see InputCapture).
 * Set synchronously after render so the very next keystroke already respects
 * it; reset to 'none' when the screen unmounts.
 */
export function useInputCapture(mode: InputCapture): void {
	const setInputCapture = useStore((s) => s.setInputCapture);

	useLayoutEffect(() => {
		setInputCapture(mode);
	}, [mode, setInputCapture]);

	useLayoutEffect(() => () => setInputCapture('none'), [setInputCapture]);
}
