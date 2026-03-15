import React, { useState, useCallback, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getMoments } from '../api/moments.js';
import { ScreenContainer } from '../components/screen-container.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import { EmptyState } from '../components/empty-state.js';
import { Pagination } from '../components/pagination.js';
import { formatMs } from '../theme/format.js';
import type { Moment, PaginatedResponse } from '../api/types.js';

export function MomentsScreen() {
	const { current, navigate } = useNavigation();
	const tagFilter = current.params?.['tag'] as string | undefined;
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [page, setPage] = useState(1);

	const fetcher = useCallback(
		() => getMoments({ page, limit: 15, tag: tagFilter }),
		[page, tagFilter],
	);
	const { data, loading, error, refetch } = useApi<
		PaginatedResponse<Moment>
	>(fetcher, `moments-${tagFilter ?? 'all'}-p${page}`, 10 * 60 * 1000);

	const moments = data?.data ?? [];
	const meta = data?.meta;

	const tags = useMemo(() => {
		const seen = new Set<string>();
		return moments
			.filter((m) => m.tag && !seen.has(m.tag.slug) && seen.add(m.tag.slug))
			.map((m) => m.tag!);
	}, [moments]);

	useInput((input, key) => {
		if (loading) return;

		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, moments.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && moments[selectedIndex]) {
			const m = moments[selectedIndex]!;
			navigate('transcript', {
				slug: m.episodeSlug,
				title: m.episodeTitle,
				seekMs: m.startTimeMs,
			});
		} else if (input === 'l' || key.rightArrow) {
			if (meta && meta.hasMore) {
				setPage((p) => p + 1);
				setSelectedIndex(0);
			}
		} else if (input === 'h' || key.leftArrow) {
			if (page > 1) {
				setPage((p) => p - 1);
				setSelectedIndex(0);
			}
		} else if (key.tab && tags.length > 0) {
			// Cycle through tag filters
			if (!tagFilter) {
				navigate('moments', { tag: tags[0]!.slug });
			} else {
				const idx = tags.findIndex((t) => t.slug === tagFilter);
				if (idx >= 0 && idx < tags.length - 1) {
					navigate('moments', { tag: tags[idx + 1]!.slug });
				} else {
					navigate('moments');
				}
			}
		} else if (input === 'r' && error) {
			refetch();
		}
	});

	if (loading) return <Loading message="Hoogtepunten laden..." />;
	if (error) return <ErrorDisplay message={error} onRetry={refetch} />;

	return (
		<ScreenContainer>
			<Box paddingY={1} gap={1}>
				<Text color={colors.cyan} bold>
					Hoogtepunten
				</Text>
				{tagFilter && (
					<Text color={colors.purple}>[{tagFilter}]</Text>
				)}
			</Box>

			<Box gap={2} paddingBottom={1}>
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>enter</Text> bekijk transcript
				</Text>
				{tags.length > 0 && (
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>tab</Text> filter onderwerp
					</Text>
				)}
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>h/l</Text> pagina
				</Text>
			</Box>

			{moments.length === 0 ? (
				<EmptyState message="Geen hoogtepunten gevonden." />
			) : (
				<Box flexDirection="column">
					{moments.map((m, i) => {
						const isSelected = i === selectedIndex;
						return (
							<Box
								key={m.id}
								flexDirection="column"
								paddingLeft={1}
								paddingBottom={isSelected ? 1 : 0}
							>
								<Box gap={1}>
									<Text
										color={
											isSelected
												? colors.cyan
												: colors.textSubtle
										}
									>
										{isSelected ? '▸' : ' '}
									</Text>
									<Text color={colors.purple}>
										{formatMs(m.startTimeMs)}
									</Text>
									<Text
										color={
											isSelected ? colors.cyan : colors.text
										}
										bold={isSelected}
									>
										{m.title}
									</Text>
									{m.tag && (
										<Text color={colors.textSubtle}>
											[{m.tag.name}]
										</Text>
									)}
								</Box>
								{isSelected && (
									<Box paddingLeft={4} flexDirection="column">
										{m.description && (
											<Text color={colors.textMuted}>
												{m.description}
											</Text>
										)}
										<Text color={colors.textSubtle}>
											{m.episodeTitle}
										</Text>
									</Box>
								)}
							</Box>
						);
					})}
				</Box>
			)}

			{meta && meta.totalPages > 1 && (
				<Box paddingTop={1}>
					<Pagination meta={meta} />
				</Box>
			)}
		</ScreenContainer>
	);
}
