import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration, formatDate, formatEpisodeNumber } from '../theme/format.js';
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
				<Text color={colors.purple} dimColor={!isSelected}>
					{formatEpisodeNumber(episode.seasonNumber, episode.episodeNumber)}
				</Text>
				<Text color={titleColor} bold={isSelected}>
					{' '}
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
				<Text color={colors.textSubtle}>
					{formatDate(episode.publishedAt)}
				</Text>
				<Text color={colors.textSubtle}>
					{formatDuration(episode.durationSeconds)}
				</Text>
				{hasProgress && (
					<Text color={colors.purple}>
						{formatDuration(historyEntry.position)} beluisterd
					</Text>
				)}
				{episode.tags.length > 0 && (
					<Text color={colors.purple}>
						{episode.tags.map((t) => t.name).join(', ')}
					</Text>
				)}
			</Box>
		</Box>
	);
}
