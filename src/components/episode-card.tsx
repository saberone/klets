import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration, formatDate } from '../theme/format.js';
import { EpisodeLabel, hasEpisodeLabel } from './episode-label.js';
import { useStore } from '../store/index.js';
import type { EpisodeListItem } from '../api/types.js';

interface EpisodeCardProps {
	episode: EpisodeListItem;
	isSelected: boolean;
}

export function EpisodeCard({ episode, isSelected }: EpisodeCardProps) {
	const indicator = isSelected ? '▸' : ' ';
	const titleColor = isSelected ? colors.cyan : colors.text;
	const historyEntry = useStore((s) =>
		s.history.find((h) => h.slug === episode.slug),
	);
	const favorited = useStore((s) =>
		s.favorites.some((f) => f.slug === episode.slug),
	);

	const hasProgress =
		historyEntry && !historyEntry.completed && historyEntry.position > 10;
	const isCompleted = historyEntry?.completed;

	return (
		<Box flexDirection="column" paddingLeft={1}>
			<Box>
				<Text color={isSelected ? colors.cyan : colors.textSubtle}>
					{indicator}{' '}
				</Text>
				<EpisodeLabel
					seasonNumber={episode.seasonNumber}
					episodeNumber={episode.episodeNumber}
					episodeType={episode.episodeType}
					dim={!isSelected}
				/>
				<Text color={titleColor} bold={isSelected}>
					{hasEpisodeLabel(episode) ? ' ' : ''}
					{episode.title}
				</Text>
				{favorited && (
					<Text color={colors.warning}> ★</Text>
				)}
				{isCompleted && (
					<Text color={colors.success}> ✓</Text>
				)}
			</Box>
			{isSelected && episode.intro && (
				<Box paddingLeft={4}>
					<Text color={colors.textMuted} wrap="truncate-end">
						{episode.intro.slice(0, 100)}
						{episode.intro.length > 100 ? '...' : ''}
					</Text>
				</Box>
			)}
			<Box paddingLeft={4} gap={2}>
				{episode.publishedAt && (
					<Text color={colors.textSubtle}>
						{formatDate(episode.publishedAt)}
					</Text>
				)}
				{episode.durationSeconds !== null && (
					<Text color={colors.textSubtle}>
						{formatDuration(episode.durationSeconds)}
					</Text>
				)}
				{hasProgress && (
					<Text color={colors.coral}>
						{formatDuration(historyEntry.position)} beluisterd
					</Text>
				)}
				{episode.tags.length > 0 && (
					<Text color={colors.coral}>
						{episode.tags.map((t) => t.name).join(', ')}
					</Text>
				)}
			</Box>
		</Box>
	);
}
