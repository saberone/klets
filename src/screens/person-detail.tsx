import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getPerson } from '../api/persons.js';
import { ScreenContainer } from '../components/screen-container.js';
import { EpisodeCard } from '../components/episode-card.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { PersonDetail, SingleResponse } from '../api/types.js';

export function PersonDetailScreen() {
	const { current, navigate } = useNavigation();
	const id = current.params?.['id'] as number;
	const [selectedIndex, setSelectedIndex] = useState(0);

	const fetcher = useCallback(() => getPerson(id), [id]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<PersonDetail>
	>(fetcher, `person-${id}`, 10 * 60 * 1000);

	const person = data?.data;
	const episodes = person?.episodes ?? [];

	useInput((input, key) => {
		if (loading) return;

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

	const links = person.socialLinks
		? Object.entries(person.socialLinks).filter(([, v]) => v !== null)
		: [];

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
					<Box gap={2} paddingTop={0}>
						{links.map(([key, url]) => (
							<Text key={key} color={colors.purple}>
								{key}: {url}
							</Text>
						))}
					</Box>
				)}
			</Box>

			{episodes.length > 0 && (
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
