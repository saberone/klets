import React, { useState, useCallback } from 'react';
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

type FocusArea = 'links' | 'episodes';

export function PersonDetailScreen() {
	const { current, navigate } = useNavigation();
	const id = current.params?.['id'] as number;
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [selectedLinkIndex, setSelectedLinkIndex] = useState(0);
	const [focusArea, setFocusArea] = useState<FocusArea>('episodes');

	const fetcher = useCallback(() => getPerson(id), [id]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<PersonDetail>
	>(fetcher, `person-${id}`, 10 * 60 * 1000);

	const person = data?.data;
	const episodes = person?.episodes ?? [];
	const links = person?.socialLinks
		? (Object.entries(person.socialLinks).filter(
				([, v]) => v !== null,
			) as [string, string][])
		: [];

	useInput((input, key) => {
		if (loading) return;

		if (key.tab && links.length > 0) {
			setFocusArea((a) => (a === 'links' ? 'episodes' : 'links'));
			return;
		}

		if (focusArea === 'links' && links.length > 0) {
			if (input === 'j' || key.downArrow) {
				setSelectedLinkIndex((i) =>
					Math.min(i + 1, links.length - 1),
				);
			} else if (input === 'k' || key.upArrow) {
				setSelectedLinkIndex((i) => Math.max(i - 1, 0));
			} else if (input === 'o' && links[selectedLinkIndex]) {
				openUrl(links[selectedLinkIndex]![1]);
			}
			return;
		}

		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, episodes.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && episodes[selectedIndex]) {
			navigate('episode-detail', { slug: episodes[selectedIndex]!.slug });
		} else if (input === 'r' && error) {
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
				{links.length > 0 && (
					<Box flexDirection="column" paddingTop={0}>
						{links.map(([key, url], i) => {
							const isSelected =
								focusArea === 'links' &&
								i === selectedLinkIndex;
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
										{key}:
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
						{focusArea === 'links' && (
							<Box paddingTop={0}>
								<Text color={colors.textSubtle}>
									<Text color={colors.cyan}>o</Text> openen
									{'  '}
									<Text color={colors.cyan}>tab</Text> naar
									afleveringen
								</Text>
							</Box>
						)}
					</Box>
				)}
			</Box>

			{episodes.length > 0 && (
				<Box flexDirection="column">
					<Text color={colors.textSubtle}>
						{person.episodeCount} afleveringen
						{links.length > 0 && focusArea === 'episodes' && (
							<Text color={colors.textSubtle}>
								{'  '}
								<Text color={colors.cyan}>tab</Text> naar links
							</Text>
						)}
					</Text>
					<Box flexDirection="column" gap={1} paddingTop={1}>
						{episodes.map((ep, i) => (
							<EpisodeCard
								key={ep.slug}
								episode={ep}
								isSelected={
									focusArea === 'episodes' &&
									i === selectedIndex
								}
							/>
						))}
					</Box>
				</Box>
			)}
		</ScreenContainer>
	);
}
