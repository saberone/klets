import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getPerson } from '../api/persons.js';
import { openUrl } from '../utils/open-url.js';
import { ScreenContainer } from '../components/screen-container.js';
import { EpisodeCard } from '../components/episode-card.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { PersonDetail, SingleResponse } from '../api/types.js';

type Section = 'links' | 'episodes';

export function PersonDetailScreen() {
	const { current, navigate } = useNavigation();
	const id = current.params?.['id'] as number;
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
	const [activeSection, setActiveSection] = useState<Section | null>(null);

	const fetcher = useCallback(() => getPerson(id), [id]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<PersonDetail>
	>(fetcher, `person-${id}`, 10 * 60 * 1000);

	const person = data?.data;
	const episodes = person?.episodes ?? [];
	const links = useMemo(
		() =>
			person?.socialLinks
				? (Object.entries(person.socialLinks).filter(
						([, v]) => v !== null,
					) as [string, string][])
				: [],
		[person],
	);

	// Determine active section: default to links if available, otherwise episodes
	const section =
		activeSection ??
		(links.length > 0 ? 'links' : episodes.length > 0 ? 'episodes' : null);

	const sections = useMemo(() => {
		const s: { key: Section; label: string }[] = [];
		if (links.length > 0) s.push({ key: 'links', label: 'Links' });
		if (episodes.length > 0)
			s.push({ key: 'episodes', label: 'Afleveringen' });
		return s;
	}, [links.length, episodes.length]);

	useInput((input, key) => {
		if (loading) return;

		// h/l to switch sections (same pattern as episode detail tabs)
		if (sections.length > 1) {
			if (input === 'h' || key.leftArrow) {
				const idx = sections.findIndex((s) => s.key === section);
				if (idx > 0) {
					setActiveSection(sections[idx - 1]!.key);
					setSelectedIndex(0);
					setSelectedLinkIndex(0);
				}
				return;
			}
			if (input === 'l' || key.rightArrow) {
				const idx = sections.findIndex((s) => s.key === section);
				if (idx < sections.length - 1) {
					setActiveSection(sections[idx + 1]!.key);
					setSelectedIndex(0);
					setSelectedLinkIndex(0);
				}
				return;
			}
		}

		if (section === 'links') {
			if (input === 'j' || key.downArrow) {
				setSelectedLinkIndex((i) =>
					Math.min(i + 1, links.length - 1),
				);
			} else if (input === 'k' || key.upArrow) {
				setSelectedLinkIndex((i) => Math.max(i - 1, 0));
			} else if (
				(input === 'o' || key.return) &&
				links[selectedLinkIndex]
			) {
				openUrl(links[selectedLinkIndex]![1]);
			}
			return;
		}

		if (section === 'episodes') {
			if (input === 'j' || key.downArrow) {
				setSelectedIndex((i) =>
					Math.min(i + 1, episodes.length - 1),
				);
			} else if (input === 'k' || key.upArrow) {
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (key.return && episodes[selectedIndex]) {
				navigate('episode-detail', {
					slug: episodes[selectedIndex]!.slug,
				});
			}
		}

		if (input === 'r' && error) {
			refetch();
		}
	});

	if (loading) return <Loading message="Persoon laden..." />;
	if (error) return <ErrorDisplay message={error} onRetry={refetch} />;
	if (!person) return null;

	return (
		<ScreenContainer>
			<Box flexDirection="column" paddingY={1}>
				<Text color={colors.cyan} bold>
					{person.name}
				</Text>
				{person.jobTitle && (
					<Text color={colors.textMuted}>{person.jobTitle}</Text>
				)}
				{person.tagline && (
					<Text color={colors.textSubtle} italic>
						{person.tagline}
					</Text>
				)}
			</Box>

			{/* Section tabs */}
			{sections.length > 0 && (
				<Box gap={2} paddingBottom={1}>
					{sections.map((s) => (
						<Text
							key={s.key}
							color={
								s.key === section
									? colors.cyan
									: colors.textSubtle
							}
							bold={s.key === section}
						>
							{s.key === section ? `▸ ${s.label}` : s.label}
						</Text>
					))}
				</Box>
			)}

			{/* Links section */}
			{section === 'links' && (
				<Box flexDirection="column">
					{links.map(([key, url], i) => {
						const isSelected = i === selectedLinkIndex;
						return (
							<Box key={key} gap={1}>
								<Text
									color={
										isSelected
											? colors.cyan
											: colors.textSubtle
									}
								>
									{isSelected ? '▸' : ' '}
								</Text>
								<Text
									color={
										isSelected
											? colors.cyan
											: colors.purple
									}
									bold={isSelected}
								>
									{key}
								</Text>
								<Text
									color={
										isSelected
											? colors.text
											: colors.textSubtle
									}
								>
									{url}
								</Text>
							</Box>
						);
					})}
					<Box paddingTop={1}>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>o</Text> openen
						</Text>
					</Box>
				</Box>
			)}

			{/* Episodes section */}
			{section === 'episodes' && (
				<Box flexDirection="column">
					<Text color={colors.textSubtle}>
						{person.episodeCount} afleveringen
					</Text>
					<Box flexDirection="column" gap={1} paddingTop={1}>
						{episodes.map((ep, i) => (
							<EpisodeCard
								key={ep.slug}
								episode={ep}
								isSelected={i === selectedIndex}
							/>
						))}
					</Box>
				</Box>
			)}
		</ScreenContainer>
	);
}
