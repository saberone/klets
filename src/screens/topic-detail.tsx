import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getTopic } from '../api/topics.js';
import { ScreenContainer } from '../components/screen-container.js';
import { EpisodeCard } from '../components/episode-card.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { TopicDetail, SingleResponse } from '../api/types.js';

export function TopicDetailScreen() {
	const { current, navigate } = useNavigation();
	const slug = current.params?.['slug'] as string;
	const [selectedIndex, setSelectedIndex] = useState(0);

	const fetcher = useCallback(() => getTopic(slug), [slug]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<TopicDetail>
	>(fetcher, `topic-${slug}`, 10 * 60 * 1000);

	const topic = data?.data;
	const episodes = topic?.episodes ?? [];

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

	if (loading) return <Loading message="Onderwerp laden..." />;
	if (error) return <ErrorDisplay message={error} onRetry={refetch} />;
	if (!topic) return null;

	return (
		<ScreenContainer>
			<Box paddingY={1} gap={1}>
				<Text color={colors.cyan} bold>
					{topic.name}
				</Text>
				<Text color={colors.textSubtle}>
					({topic.episodeCount} afleveringen)
				</Text>
			</Box>

			<Box flexDirection="column" gap={1}>
				{episodes.map((ep, i) => (
					<EpisodeCard
						key={ep.slug}
						episode={ep}
						isSelected={i === selectedIndex}
					/>
				))}
			</Box>
		</ScreenContainer>
	);
}
