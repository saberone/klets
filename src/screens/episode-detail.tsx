import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration, formatDate, formatEpisodeNumber } from '../theme/format.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { usePlayer } from '../hooks/use-player.js';
import { useApi } from '../hooks/use-api.js';
import { getEpisode } from '../api/episodes.js';
import { play, stop as stopPlayer, isActive } from '../player/index.js';
import { ScreenContainer } from '../components/screen-container.js';
import { TagPill } from '../components/tag-pill.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { EpisodeDetail, SingleResponse } from '../api/types.js';

interface Section {
	label: string;
	key: string;
}

export function EpisodeDetailScreen() {
	const { current } = useNavigation();
	const slug = current.params?.['slug'] as string;
	const [activeSection, setActiveSection] = useState(0);
	const player = usePlayer();

	const fetcher = useCallback(() => getEpisode(slug), [slug]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<EpisodeDetail>
	>(fetcher, `episode-${slug}`, 10 * 60 * 1000);

	const episode = data?.data;

	const sections = useMemo<Section[]>(() => {
		if (!episode) return [];
		const s: Section[] = [{ label: 'Info', key: 'info' }];
		if (episode.showNotes) s.push({ label: 'Show Notes', key: 'notes' });
		if (episode.chapters.length > 0)
			s.push({ label: 'Hoofdstukken', key: 'chapters' });
		if (episode.learningPoints.length > 0)
			s.push({ label: 'Leerpunten', key: 'learning' });
		if (episode.persons.length > 0)
			s.push({ label: 'Deelnemers', key: 'persons' });
		if (episode.links.length > 0) s.push({ label: 'Links', key: 'links' });
		return s;
	}, [episode]);

	useInput((input, key) => {
		if (!episode) return;
		if (input === 'j' || key.downArrow) {
			setActiveSection((i) => Math.min(i + 1, sections.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setActiveSection((i) => Math.max(i - 1, 0));
		} else if (input === 'p') {
			if (player.currentEpisodeSlug === slug && isActive()) {
				stopPlayer();
				player.stop();
			} else {
				player.setPlaying(slug, episode.title, episode.durationSeconds);
				play(slug);
			}
		} else if (input === 'r' && error) {
			refetch();
		}
	});

	if (loading) return <Loading message="Aflevering laden..." />;
	if (error) return <ErrorDisplay message={error} onRetry={refetch} />;
	if (!episode) return null;

	const currentKey = sections[activeSection]?.key;

	return (
		<ScreenContainer>
			{/* Title block — always visible */}
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
				<Box gap={2}>
					<Text color={colors.textSubtle}>
						{formatDate(episode.publishedAt)}
					</Text>
					<Text color={colors.textSubtle}>
						{formatDuration(episode.durationSeconds)}
					</Text>
					{episode.explicit && <Text color={colors.warning}>E</Text>}
				</Box>
				{episode.tags.length > 0 && (
					<Box gap={1}>
						{episode.tags.map((t) => (
							<TagPill key={t.slug} name={t.name} />
						))}
					</Box>
				)}
			</Box>

			{/* Play hint + section tabs */}
			<Box paddingBottom={1}>
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>p</Text>
					{player.currentEpisodeSlug === slug && isActive()
						? ' stop'
						: ' afspelen'}
					{'  '}
				</Text>
			</Box>

			<Box gap={2} paddingBottom={1}>
				{sections.map((s, i) => (
					<Text
						key={s.key}
						color={i === activeSection ? colors.cyan : colors.textSubtle}
						bold={i === activeSection}
					>
						{i === activeSection ? `▸ ${s.label}` : s.label}
					</Text>
				))}
			</Box>

			{/* Active section content */}
			{currentKey === 'info' && episode.intro && (
				<Box paddingBottom={1}>
					<Text color={colors.text} italic>
						{episode.intro}
					</Text>
				</Box>
			)}

			{currentKey === 'notes' && episode.showNotes && (
				<Box flexDirection="column">
					<Text color={colors.textMuted}>{episode.showNotes}</Text>
				</Box>
			)}

			{currentKey === 'chapters' && (
				<Box flexDirection="column">
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

			{currentKey === 'learning' && (
				<Box flexDirection="column">
					{episode.learningPoints.map((lp) => (
						<Box key={lp.order} gap={1}>
							<Text color={colors.purple}>{lp.order}.</Text>
							<Text color={colors.textMuted}>{lp.content}</Text>
						</Box>
					))}
				</Box>
			)}

			{currentKey === 'persons' && (
				<Box flexDirection="column">
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

			{currentKey === 'links' && (
				<Box flexDirection="column">
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
