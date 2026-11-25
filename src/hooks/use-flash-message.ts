import { useState, useRef, useEffect, useCallback } from 'react';

export type FlashTone = 'success' | 'error' | 'info';

export interface FlashMessage {
	text: string;
	tone: FlashTone;
}

/**
 * A short-lived status message (e.g. "Link gekopieerd") that clears itself.
 */
export function useFlashMessage(): [
	FlashMessage | null,
	(text: string, tone?: FlashTone, durationMs?: number) => void,
] {
	const [message, setMessage] = useState<FlashMessage | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(
		() => () => {
			if (timer.current) clearTimeout(timer.current);
		},
		[],
	);

	const show = useCallback(
		(text: string, tone: FlashTone = 'info', durationMs = 2000) => {
			if (timer.current) clearTimeout(timer.current);
			setMessage({ text, tone });
			timer.current = setTimeout(() => {
				timer.current = null;
				setMessage(null);
			}, durationMs);
		},
		[],
	);

	return [message, show];
}
