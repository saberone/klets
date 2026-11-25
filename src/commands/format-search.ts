import type { SearchData } from '../api/types.js';
import { formatEpisodeNumber, formatMs } from '../theme/format.js';
import { buildEpisodeUrl, buildSegmentUrl } from '../utils/share-url.js';
import { createStyle } from './output.js';

/** Human-readable search results for the terminal. */
export function formatSearchResults(
	query: string,
	data: SearchData,
	color: boolean,
): string {
	const style = createStyle(color);
	const episodes = data.episodes ?? [];
	const transcripts = data.transcripts ?? [];

	if (episodes.length === 0 && transcripts.length === 0) {
		return `Geen resultaten voor "${query}".`;
	}

	const lines: string[] = [];

	lines.push(style.bold(`Afleveringen (${episodes.length})`));
	if (episodes.length === 0) lines.push('  Geen afleveringen gevonden.');
	for (const ep of episodes) {
		const number = formatEpisodeNumber(ep.seasonNumber, ep.episodeNumber);
		lines.push(
			`  ${number ? `${style.coral(number)}  ` : ''}${style.bold(ep.title)}`,
		);
		lines.push(`  ${style.dim(buildEpisodeUrl(ep.slug))}`);
	}

	lines.push('');
	lines.push(style.bold(`Transcripten (${transcripts.length})`));
	if (transcripts.length === 0) lines.push('  Geen transcripten gevonden.');
	for (const t of transcripts) {
		const speaker = t.speaker ? `${style.cyan(t.speaker)}: ` : '';
		lines.push(
			`  ${style.bold(t.episodeTitle)}  ${style.coral(formatMs(t.startTimeMs))}`,
		);
		lines.push(`  ${speaker}${t.text.replace(/\s*\n\s*/g, ' ').trim()}`);
		lines.push(`  ${style.dim(buildSegmentUrl(t.episodeSlug, t.startTimeMs))}`);
	}

	return lines.join('\n');
}
