import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { search as searchApi } from '../api/search.js';
import { ScreenContainer } from '../components/screen-container.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import { formatEpisodeNumber } from '../theme/format.js';
import type { SearchData } from '../api/types.js';

export function SearchScreen() {
	const [query, setQuery] = useState('');
	const [submitted, setSubmitted] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [results, setResults] = useState<SearchData | null>(null);
	const { navigate } = useNavigation();

	useEffect(() => {
		if (!submitted) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		searchApi(submitted)
			.then((res) => {
				if (!cancelled) setResults(res.data);
			})
			.catch((err) => {
				if (!cancelled)
					setError(
						err instanceof Error ? err.message : 'Onbekende fout',
					);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [submitted]);

	const episodes = results?.episodes ?? [];

	useInput((input, key) => {
		if (key.return && query.length >= 2 && !submitted) {
			setSubmitted(query);
			setSelectedIndex(0);
			return;
		}

		if (submitted) {
			if (input === 'j' || key.downArrow) {
				setSelectedIndex((i) => Math.min(i + 1, episodes.length - 1));
			} else if (input === 'k' || key.upArrow) {
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (key.return && episodes[selectedIndex]) {
				navigate('episode-detail', {
					slug: episodes[selectedIndex]!.slug,
				});
			} else if (key.backspace || key.delete) {
				setSubmitted('');
				setQuery('');
				setResults(null);
			}
			return;
		}

		if (key.backspace || key.delete) {
			setQuery((q) => q.slice(0, -1));
		} else if (input && !key.ctrl && !key.meta) {
			setQuery((q) => q + input);
		}
	});

	return (
		<ScreenContainer>
			<Box paddingY={1} gap={1}>
				<Text color={colors.cyan} bold>
					Zoeken:
				</Text>
				<Text color={colors.text}>
					{query}
					{!submitted && <Text color={colors.cyan}>▌</Text>}
				</Text>
			</Box>

			{!submitted && (
				<Text color={colors.textSubtle}>
					Typ minimaal 2 tekens en druk op enter
				</Text>
			)}

			{submitted && loading && <Loading message="Zoeken..." />}
			{submitted && error && (
				<ErrorDisplay message={error} onRetry={() => setSubmitted(query)} />
			)}

			{submitted && !loading && !error && (
				<Box flexDirection="column">
					{episodes.length === 0 ? (
						<Text color={colors.textMuted}>
							Geen resultaten voor &quot;{submitted}&quot;
						</Text>
					) : (
						<>
							<Text color={colors.textSubtle}>
								{episodes.length} resultaten
							</Text>
							<Box flexDirection="column" paddingTop={1}>
								{episodes.map((ep, i) => {
									const isSelected = i === selectedIndex;
									return (
										<Box key={ep.slug} gap={1} paddingLeft={1}>
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
												{formatEpisodeNumber(
													ep.seasonNumber,
													ep.episodeNumber,
												)}
											</Text>
											<Text
												color={
													isSelected ? colors.cyan : colors.text
												}
												bold={isSelected}
											>
												{ep.title}
											</Text>
										</Box>
									);
								})}
							</Box>
						</>
					)}
					<Box paddingTop={1}>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>backspace</Text> nieuwe zoekopdracht
						</Text>
					</Box>
				</Box>
			)}
		</ScreenContainer>
	);
}
