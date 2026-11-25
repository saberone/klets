import type { EpisodeType } from '../api/types.js';

/** Formats seconds as m:ss or h:mm:ss. Returns '' for unknown (null/invalid) durations. */
export function formatDuration(seconds: number | null | undefined): string {
	if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) {
		return '';
	}
	const total = Math.max(0, seconds);
	const h = Math.floor(total / 3600);
	const m = Math.floor((total % 3600) / 60);
	const s = Math.floor(total % 60);

	if (h > 0) {
		return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
	return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Formats an ISO date in Dutch. Returns '' for missing or unparseable dates. */
export function formatDate(isoDate: string | null | undefined): string {
	if (!isoDate) return '';
	const d = new Date(isoDate);
	if (Number.isNaN(d.getTime())) return '';
	return d.toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

export function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Formats milliseconds as h:mm:ss (hours always shown). */
export function formatMsLong(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000));
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = totalSeconds % 60;
	return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * Formats SxxEyy. Returns '' when either number is missing, so episodes
 * without numbering never show "S00E00".
 */
export function formatEpisodeNumber(
	season: number | null | undefined,
	episode: number | null | undefined,
): string {
	if (
		season === null ||
		season === undefined ||
		episode === null ||
		episode === undefined
	) {
		return '';
	}
	return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
}

/** Badge text for non-regular episodes ("TRAILER" / "BONUS"), or null for full episodes. */
export function episodeTypeBadge(
	episodeType: EpisodeType | string | null | undefined,
): string | null {
	if (episodeType === 'trailer') return 'TRAILER';
	if (episodeType === 'bonus') return 'BONUS';
	return null;
}

/** Plain-text episode label: "S01E05", "TRAILER", "S01E05 BONUS" or ''. */
export function formatEpisodeLabel(episode: {
	seasonNumber?: number | null;
	episodeNumber?: number | null;
	episodeType?: EpisodeType | string | null;
}): string {
	return [
		formatEpisodeNumber(episode.seasonNumber, episode.episodeNumber),
		episodeTypeBadge(episode.episodeType),
	]
		.filter(Boolean)
		.join(' ');
}

/** Relative Dutch date for recent timestamps ("vandaag", "gisteren", "3 dagen geleden"), else formatDate. */
export function formatRelativeDate(
	isoDate: string | null | undefined,
	now: Date = new Date(),
): string {
	if (!isoDate) return '';
	const d = new Date(isoDate);
	if (Number.isNaN(d.getTime())) return '';
	const startOfDay = (x: Date) =>
		new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
	const days = Math.round((startOfDay(now) - startOfDay(d)) / 86_400_000);
	if (days <= 0) return 'vandaag';
	if (days === 1) return 'gisteren';
	if (days < 7) return `${days} dagen geleden`;
	return formatDate(isoDate);
}
