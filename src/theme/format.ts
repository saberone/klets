export function formatDuration(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = seconds % 60;

	if (h > 0) {
		return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
	}
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(isoDate: string): string {
	const d = new Date(isoDate);
	return d.toLocaleDateString('nl-NL', {
		day: 'numeric',
		month: 'short',
		year: 'numeric',
	});
}

export function formatEpisodeNumber(
	season: number,
	episode: number,
): string {
	return `S${season.toString().padStart(2, '0')}E${episode.toString().padStart(2, '0')}`;
}
