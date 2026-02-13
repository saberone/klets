import { useState, useEffect, useCallback, useRef } from 'react';
import { useInput } from 'ink';

export type KonamiKey = 'up' | 'down' | 'left' | 'right' | 'b' | 'a';

export const KONAMI_SEQUENCE: KonamiKey[] = [
	'up',
	'up',
	'down',
	'down',
	'left',
	'right',
	'left',
	'right',
	'b',
	'a',
];

/**
 * Pure sequence matcher — returns the new position and whether the sequence is complete.
 */
export function matchKonamiKey(
	key: KonamiKey,
	position: number,
): { position: number; complete: boolean } {
	if (key === KONAMI_SEQUENCE[position]) {
		const next = position + 1;
		if (next === KONAMI_SEQUENCE.length) {
			return { position: 0, complete: true };
		}
		return { position: next, complete: false };
	}
	// Check if the failed key matches the start of the sequence
	return { position: key === KONAMI_SEQUENCE[0] ? 1 : 0, complete: false };
}

const PARTY_DURATION = 8000;

export function useKonamiCode() {
	const [activated, setActivated] = useState(false);
	const positionRef = useRef(0);
	const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const reset = useCallback(() => {
		setActivated(false);
		positionRef.current = 0;
	}, []);

	useInput((input, key) => {
		if (activated) return;

		let pressed: KonamiKey | null = null;

		if (key.upArrow) pressed = 'up';
		else if (key.downArrow) pressed = 'down';
		else if (key.leftArrow) pressed = 'left';
		else if (key.rightArrow) pressed = 'right';
		else if (input === 'b') pressed = 'b';
		else if (input === 'a') pressed = 'a';

		if (!pressed) return;

		const result = matchKonamiKey(pressed, positionRef.current);
		positionRef.current = result.position;
		if (result.complete) {
			setActivated(true);
		}
	});

	useEffect(() => {
		if (activated) {
			timerRef.current = setTimeout(reset, PARTY_DURATION);
		}
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
				timerRef.current = null;
			}
		};
	}, [activated, reset]);

	return { activated, reset };
}
