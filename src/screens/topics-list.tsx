import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getTopics } from '../api/topics.js';
import { ScreenContainer } from '../components/screen-container.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { PaginatedResponse, Topic } from '../api/types.js';

export function TopicsListScreen() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { navigate } = useNavigation();

	const fetcher = useCallback(() => getTopics(), []);
	const { data, loading, error, refetch } = useApi<
		PaginatedResponse<Topic>
	>(fetcher, 'topics', 60 * 60 * 1000);

	const topics = data?.data ?? [];

	useInput((input, key) => {
		if (loading) return;

		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, topics.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && topics[selectedIndex]) {
			navigate('topic-detail', { slug: topics[selectedIndex]!.slug });
		} else if (input === 'r' && error) {
			refetch();
		}
	});

	return (
		<ScreenContainer>
			<Box paddingY={1}>
				<Text color={colors.cyan} bold>
					Onderwerpen
				</Text>
			</Box>

			{loading && <Loading message="Onderwerpen laden..." />}
			{error && <ErrorDisplay message={error} onRetry={refetch} />}

			{!loading && !error && (
				<Box flexDirection="column">
					{topics.map((topic, i) => {
						const isSelected = i === selectedIndex;
						return (
							<Box key={topic.slug} gap={1} paddingLeft={1}>
								<Text
									color={isSelected ? colors.cyan : colors.textSubtle}
								>
									{isSelected ? '▸' : ' '}
								</Text>
								<Text
									color={isSelected ? colors.cyan : colors.text}
									bold={isSelected}
								>
									{topic.name}
								</Text>
								<Text color={colors.textSubtle}>
									({topic.episodeCount} afleveringen)
								</Text>
							</Box>
						);
					})}
				</Box>
			)}
		</ScreenContainer>
	);
}
