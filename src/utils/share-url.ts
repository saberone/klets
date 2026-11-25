export const SITE_URL = 'https://codeklets.nl';

/**
 * Public link to an episode on codeklets.nl. With `seconds`, adds `?t=` with
 * whole seconds (floored); `t` is omitted when it would be 0 or invalid.
 */
export function buildEpisodeUrl(slug: string, seconds?: number | null): string {
	const base = `${SITE_URL}/afleveringen/${encodeURIComponent(slug)}`;
	if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
		return base;
	}
	const t = Math.floor(seconds);
	return t > 0 ? `${base}?t=${t}` : base;
}

/** Link to the moment a transcript segment starts (startTimeMs in milliseconds). */
export function buildSegmentUrl(slug: string, startTimeMs: number): string {
	return buildEpisodeUrl(slug, startTimeMs / 1000);
}
