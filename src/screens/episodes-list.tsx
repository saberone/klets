import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getEpisodes } from '../api/episodes.js';
import { ScreenContainer } from '../components/screen-container.js';
import { EpisodeCard } from '../components/episode-card.js';
import { Pagination } from '../components/pagination.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { EpisodeListItem, PaginatedResponse } from '../api/types.js';

export function EpisodesListScreen() {
	const [page, setPage] = useState(1);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { navigate } = useNavigation();

	const fetcher = useCallback(
		() => getEpisodes({ page, limit: 15 }),
		[page],
	);

	const { data, loading, error, refetch } = useApi<
		PaginatedResponse<EpisodeListItem>
	>(fetcher, `episodes-page-${page}`);

	const episodes = data?.data ?? [];
	const meta = data?.meta;

	useInput((input, key) => {
		if (loading) return;

		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, episodes.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && episodes[selectedIndex]) {
			navigate('episode-detail', {
				slug: episodes[selectedIndex]!.slug,
			});
		} else if (input === 'l' && meta?.hasMore) {
			setPage((p) => p + 1);
			setSelectedIndex(0);
		} else if (input === 'h' && meta && meta.page > 1) {
			setPage((p) => p - 1);
			setSelectedIndex(0);
		} else if (input === 'r' && error) {
			refetch();
		}
	});

	return (
		<ScreenContainer>
			<Box paddingY={1}>
				<Text color={colors.cyan} bold>
					Afleveringen
				</Text>
			</Box>

			{loading && <Loading message="Afleveringen laden..." />}
			{error && <ErrorDisplay message={error} onRetry={refetch} />}

			{!loading && !error && (
				<Box flexDirection="column" gap={1}>
					{episodes.map((ep, i) => (
						<EpisodeCard
							key={ep.slug}
							episode={ep}
							isSelected={i === selectedIndex}
						/>
					))}
				</Box>
			)}

			{meta && <Pagination meta={meta} />}
		</ScreenContainer>
	);
}
