import { useCallback } from 'react';
import { copyToClipboard, type CopyOutcome } from '../utils/clipboard.js';
import type { FlashTone } from './use-flash-message.js';

export const COPIED_MESSAGE = 'Link gekopieerd';

/** The flash message for a copy outcome (pure, tested). */
export function shareMessage(
	outcome: CopyOutcome,
	url: string,
): { text: string; tone: FlashTone; durationMs: number } {
	switch (outcome) {
		case 'copied':
			return { text: COPIED_MESSAGE, tone: 'success', durationMs: 2000 };
		case 'sent':
			// OSC 52 usually works, but we cannot know: show the URL too
			return {
				text: `Link naar het klembord van je terminal gestuurd: ${url}`,
				tone: 'info',
				durationMs: 10_000,
			};
		case 'failed':
			return {
				text: `Kopiëren niet gelukt, selecteer de link: ${url}`,
				tone: 'error',
				durationMs: 10_000,
			};
	}
}

/**
 * Returns share(url): copies the link and reports through the screen's flash
 * message. When the copy is not confirmed the URL itself is shown.
 */
export function useShareLink(
	showFlash: (text: string, tone?: FlashTone, durationMs?: number) => void,
): (url: string) => Promise<void> {
	return useCallback(
		async (url: string) => {
			const { text, tone, durationMs } = shareMessage(
				await copyToClipboard(url),
				url,
			);
			showFlash(text, tone, durationMs);
		},
		[showFlash],
	);
}
