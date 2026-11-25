import React from 'react';
import { Text } from 'ink';
import { colors } from '../theme/colors.js';
import { episodeTypeBadge, formatEpisodeNumber } from '../theme/format.js';
import type { EpisodeType } from '../api/types.js';

interface EpisodeLabelProps {
	seasonNumber?: number | null;
	episodeNumber?: number | null;
	episodeType?: EpisodeType | null;
	dim?: boolean;
	bold?: boolean;
}

/**
 * "S01E05", a TRAILER / BONUS badge, or both. Renders nothing for an
 * episode without numbers and without a special type.
 */
export function EpisodeLabel({
	seasonNumber,
	episodeNumber,
	episodeType,
	dim = false,
	bold = false,
}: EpisodeLabelProps) {
	const number = formatEpisodeNumber(seasonNumber, episodeNumber);
	const badge = episodeTypeBadge(episodeType);
	if (!number && !badge) return null;

	return (
		<Text>
			{number && (
				<Text color={colors.coral} dimColor={dim} bold={bold}>
					{number}
				</Text>
			)}
			{number && badge ? ' ' : ''}
			{badge && (
				<Text color={colors.warning} bold>
					{badge}
				</Text>
			)}
		</Text>
	);
}

/** True when EpisodeLabel would render something. */
export function hasEpisodeLabel(episode: {
	seasonNumber?: number | null;
	episodeNumber?: number | null;
	episodeType?: EpisodeType | null;
}): boolean {
	return (
		formatEpisodeNumber(episode.seasonNumber, episode.episodeNumber) !== '' ||
		episodeTypeBadge(episode.episodeType) !== null
	);
}
