import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { useScrollableList } from '../hooks/use-scrollable-list.js';
import { getTopics } from '../api/topics.js';
import { ScreenContainer } from '../components/screen-container.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import { EmptyState } from '../components/empty-state.js';
import type { PaginatedResponse, Topic } from '../api/types.js';

export function TopicsListScreen() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { navigate } = useNavigation();

	const fetcher = useCallback(() => getTopics(), []);
	const { data, loading, error, refetch } = useApi<
		PaginatedResponse<Topic>
	>(fetcher, 'topics', 60 * 60 * 1000);

	const topics = data?.data ?? [];
	const { visibleRange, hasMoreAbove, hasMoreBelow, aboveCount, belowCount } =
		useScrollableList(topics.length, selectedIndex);

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

			{!loading && !error && topics.length === 0 && (
				<EmptyState message="Geen onderwerpen gevonden." />
			)}

			{!loading && !error && topics.length > 0 && (
				<Box flexDirection="column">
					{hasMoreAbove && (
						<Text color={colors.textSubtle} dimColor>
							{'  '}▲ {aboveCount} meer
						</Text>
					)}
					{topics.slice(visibleRange[0], visibleRange[1]).map((topic, vi) => {
						const i = visibleRange[0] + vi;
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
					{hasMoreBelow && (
						<Text color={colors.textSubtle} dimColor>
							{'  '}▼ {belowCount} meer
						</Text>
					)}
				</Box>
			)}
		</ScreenContainer>
	);
}
