import React, { useCallback } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration, formatDate, formatEpisodeNumber } from '../theme/format.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getEpisode } from '../api/episodes.js';
import { ScreenContainer } from '../components/screen-container.js';
import { TagPill } from '../components/tag-pill.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { EpisodeDetail, SingleResponse } from '../api/types.js';

export function EpisodeDetailScreen() {
	const { current } = useNavigation();
	const slug = current.params?.['slug'] as string;

	const fetcher = useCallback(() => getEpisode(slug), [slug]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<EpisodeDetail>
	>(fetcher, `episode-${slug}`, 10 * 60 * 1000);

	const episode = data?.data;

	if (loading) return <Loading message="Aflevering laden..." />;
	if (error) return <ErrorDisplay message={error} onRetry={refetch} />;
	if (!episode) return null;

	return (
		<ScreenContainer>
			{/* Title block */}
			<Box flexDirection="column" paddingY={1}>
				<Box gap={1}>
					<Text color={colors.purple} bold>
						{formatEpisodeNumber(
							episode.seasonNumber,
							episode.episodeNumber,
						)}
					</Text>
					<Text color={colors.cyan} bold>
						{episode.title}
					</Text>
				</Box>
				<Box gap={2} paddingTop={0}>
					<Text color={colors.textSubtle}>
						{formatDate(episode.publishedAt)}
					</Text>
					<Text color={colors.textSubtle}>
						{formatDuration(episode.durationSeconds)}
					</Text>
					{episode.explicit && <Text color={colors.warning}>E</Text>}
				</Box>
				{episode.tags.length > 0 && (
					<Box gap={1} paddingTop={0}>
						{episode.tags.map((t) => (
							<TagPill key={t.slug} name={t.name} />
						))}
					</Box>
				)}
			</Box>

			{/* Intro */}
			{episode.intro && (
				<Box paddingBottom={1}>
					<Text color={colors.text} italic>
						{episode.intro}
					</Text>
				</Box>
			)}

			{/* Show Notes */}
			{episode.showNotes && (
				<Box flexDirection="column" paddingBottom={1}>
					<Text color={colors.cyan} bold>
						{'─── Show Notes ───'}
					</Text>
					<Text color={colors.textMuted}>{episode.showNotes}</Text>
				</Box>
			)}

			{/* Chapters */}
			{episode.chapters.length > 0 && (
				<Box flexDirection="column" paddingBottom={1}>
					<Text color={colors.cyan} bold>
						{'─── Hoofdstukken ───'}
					</Text>
					{episode.chapters.map((ch, i) => (
						<Box key={i} gap={1}>
							<Text color={colors.purple}>
								{formatDuration(ch.startTime)}
							</Text>
							<Text color={colors.text}>{ch.title}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Learning Points */}
			{episode.learningPoints.length > 0 && (
				<Box flexDirection="column" paddingBottom={1}>
					<Text color={colors.cyan} bold>
						{'─── Leerpunten ───'}
					</Text>
					{episode.learningPoints.map((lp) => (
						<Box key={lp.order} gap={1}>
							<Text color={colors.purple}>{lp.order}.</Text>
							<Text color={colors.textMuted}>{lp.content}</Text>
						</Box>
					))}
				</Box>
			)}

			{/* Persons */}
			{episode.persons.length > 0 && (
				<Box flexDirection="column" paddingBottom={1}>
					<Text color={colors.cyan} bold>
						{'─── Deelnemers ───'}
					</Text>
					{episode.persons.map((p) => (
						<Box key={p.id} gap={1}>
							<Text color={colors.text} bold>
								{p.name}
							</Text>
							<Text color={colors.textSubtle}>({p.role})</Text>
							{p.jobTitle && (
								<Text color={colors.textMuted}>· {p.jobTitle}</Text>
							)}
						</Box>
					))}
				</Box>
			)}

			{/* Links */}
			{episode.links.length > 0 && (
				<Box flexDirection="column">
					<Text color={colors.cyan} bold>
						{'─── Links ───'}
					</Text>
					{episode.links.map((link, i) => (
						<Box key={i} gap={1}>
							<Text color={colors.purple}>•</Text>
							<Text color={colors.text}>{link.title}</Text>
							<Text color={colors.textSubtle}>{link.url}</Text>
						</Box>
					))}
				</Box>
			)}
		</ScreenContainer>
	);
}
