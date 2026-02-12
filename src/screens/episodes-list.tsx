import React, { useState, useCallback, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { useScrollableList } from '../hooks/use-scrollable-list.js';
import { getEpisodes } from '../api/episodes.js';
import { getSeasons } from '../api/seasons.js';
import { ScreenContainer } from '../components/screen-container.js';
import { EpisodeCard } from '../components/episode-card.js';
import { Pagination } from '../components/pagination.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type {
	EpisodeListItem,
	EpisodesQuery,
	PaginatedResponse,
	Season,
} from '../api/types.js';

const SORT_OPTIONS = [
	{ value: 'newest', label: 'Nieuwste' },
	{ value: 'oldest', label: 'Oudste' },
	{ value: 'alpha', label: 'A-Z' },
	{ value: 'longest', label: 'Langste' },
	{ value: 'shortest', label: 'Kortste' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

export function EpisodesListScreen() {
	const [page, setPage] = useState(1);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [season, setSeason] = useState<number | undefined>(undefined);
	const [sort, setSort] = useState<SortValue>('newest');
	const [seasons, setSeasons] = useState<Season[]>([]);
	const { navigate } = useNavigation();

	// Fetch seasons for the filter
	useEffect(() => {
		getSeasons()
			.then((res) => setSeasons(res.data))
			.catch(() => {});
	}, []);

	const query: EpisodesQuery = { page, limit: 15, sort };
	if (season) query.season = season;

	const cacheKey = `episodes-p${page}-s${season ?? 'all'}-${sort}`;
	const fetcher = useCallback(() => getEpisodes(query), [cacheKey]);

	const { data, loading, error, refetch } = useApi<
		PaginatedResponse<EpisodeListItem>
	>(fetcher, cacheKey);

	const episodes = data?.data ?? [];
	const meta = data?.meta;
	const { visibleRange, hasMoreAbove, hasMoreBelow, aboveCount, belowCount } =
		useScrollableList(episodes.length, selectedIndex, { linesPerItem: 3 });

	const sortIndex = SORT_OPTIONS.findIndex((o) => o.value === sort);

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
		} else if (input === 's') {
			// Cycle sort
			const next = (sortIndex + 1) % SORT_OPTIONS.length;
			setSort(SORT_OPTIONS[next]!.value);
			setPage(1);
			setSelectedIndex(0);
		} else if (input === 'f') {
			// Cycle season filter
			if (seasons.length === 0) return;
			if (season === undefined) {
				setSeason(seasons[0]!.seasonNumber);
			} else {
				const idx = seasons.findIndex(
					(s) => s.seasonNumber === season,
				);
				if (idx === seasons.length - 1) {
					setSeason(undefined);
				} else {
					setSeason(seasons[idx + 1]!.seasonNumber);
				}
			}
			setPage(1);
			setSelectedIndex(0);
		} else if (input === 'r' && error) {
			refetch();
		}
	});

	const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label;

	return (
		<ScreenContainer>
			{/* Filter bar */}
			<Box paddingY={1} gap={2}>
				<Text color={colors.cyan} bold>
					Afleveringen
				</Text>
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>f</Text> seizoen:{' '}
					<Text color={colors.text}>
						{season ? `S${season.toString().padStart(2, '0')}` : 'Alle'}
					</Text>
				</Text>
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>s</Text> sorteer:{' '}
					<Text color={colors.text}>{sortLabel}</Text>
				</Text>
			</Box>

			{loading && <Loading message="Afleveringen laden..." />}
			{error && <ErrorDisplay message={error} onRetry={refetch} />}

			{!loading && !error && (
				<Box flexDirection="column" gap={1}>
					{episodes.length === 0 ? (
						<Text color={colors.textMuted}>
							Geen afleveringen gevonden.
						</Text>
					) : (
						<>
							{hasMoreAbove && (
								<Text color={colors.textSubtle} dimColor>
									{'  '}▲ {aboveCount} meer
								</Text>
							)}
							{episodes.slice(visibleRange[0], visibleRange[1]).map((ep, vi) => (
								<EpisodeCard
									key={ep.slug}
									episode={ep}
									isSelected={visibleRange[0] + vi === selectedIndex}
								/>
							))}
							{hasMoreBelow && (
								<Text color={colors.textSubtle} dimColor>
									{'  '}▼ {belowCount} meer
								</Text>
							)}
						</>
					)}
				</Box>
			)}

			{meta && <Pagination meta={meta} />}
		</ScreenContainer>
	);
}
