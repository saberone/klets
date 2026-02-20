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

type ResultTab = 'episodes' | 'transcripts';

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SearchScreen() {
	const [query, setQuery] = useState('');
	const [submitted, setSubmitted] = useState('');
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [activeTab, setActiveTab] = useState<ResultTab>('episodes');
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
	const transcripts = results?.transcripts ?? [];
	const currentItems = activeTab === 'episodes' ? episodes : transcripts;

	useInput((input, key) => {
		if (key.return && query.length >= 2 && !submitted) {
			setSubmitted(query);
			setSelectedIndex(0);
			setActiveTab('episodes');
			return;
		}

		if (submitted) {
			if (key.tab) {
				// Tab to switch between result tabs
				setActiveTab((t) =>
					t === 'episodes' ? 'transcripts' : 'episodes',
				);
				setSelectedIndex(0);
			} else if (input === 'j' || key.downArrow) {
				setSelectedIndex((i) =>
					Math.min(i + 1, currentItems.length - 1),
				);
			} else if (input === 'k' || key.upArrow) {
				setSelectedIndex((i) => Math.max(i - 1, 0));
			} else if (key.return) {
				if (activeTab === 'episodes' && episodes[selectedIndex]) {
					navigate('episode-detail', {
						slug: episodes[selectedIndex]!.slug,
					});
				} else if (
					activeTab === 'transcripts' &&
					transcripts[selectedIndex]
				) {
					const t = transcripts[selectedIndex]!;
					navigate('transcript', {
						slug: t.episodeSlug,
						title: t.episodeTitle,
						seekMs: t.startTimeMs,
					});
				}
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
					{/* Tab bar */}
					<Box gap={2} paddingBottom={1}>
						<Text
							color={
								activeTab === 'episodes'
									? colors.cyan
									: colors.textSubtle
							}
							bold={activeTab === 'episodes'}
						>
							{activeTab === 'episodes' ? '▸ ' : '  '}
							Afleveringen ({episodes.length})
						</Text>
						<Text
							color={
								activeTab === 'transcripts'
									? colors.cyan
									: colors.textSubtle
							}
							bold={activeTab === 'transcripts'}
						>
							{activeTab === 'transcripts' ? '▸ ' : '  '}
							Transcripten ({transcripts.length})
						</Text>
					</Box>

					{activeTab === 'episodes' && (
						<>
							{episodes.length === 0 ? (
								<Text color={colors.textMuted}>
									Geen afleveringen voor &quot;{submitted}
									&quot;
								</Text>
							) : (
								<Box flexDirection="column" paddingTop={1}>
									{episodes.map((ep, i) => {
										const isSelected = i === selectedIndex;
										return (
											<Box
												key={ep.slug}
												gap={1}
												paddingLeft={1}
											>
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
														isSelected
															? colors.cyan
															: colors.text
													}
													bold={isSelected}
												>
													{ep.title}
												</Text>
											</Box>
										);
									})}
								</Box>
							)}
						</>
					)}

					{activeTab === 'transcripts' && (
						<>
							{transcripts.length === 0 ? (
								<Text color={colors.textMuted}>
									Geen transcripten voor &quot;{submitted}
									&quot;
								</Text>
							) : (
								<Box flexDirection="column" paddingTop={1}>
									{transcripts.map((t, i) => {
										const isSelected = i === selectedIndex;
										return (
											<Box
												key={`${t.episodeSlug}-${t.startTimeMs}`}
												flexDirection="column"
												paddingLeft={1}
												paddingBottom={
													isSelected ? 1 : 0
												}
											>
												<Box gap={1}>
													<Text
														color={
															isSelected
																? colors.cyan
																: colors.textSubtle
														}
													>
														{isSelected
															? '▸'
															: ' '}
													</Text>
													<Text
														color={colors.purple}
													>
														{formatMs(
															t.startTimeMs,
														)}
													</Text>
													{t.speaker && (
														<Text
															color={
																colors.warning
															}
															bold={isSelected}
														>
															{t.speaker}
														</Text>
													)}
													<Text
														color={
															isSelected
																? colors.text
																: colors.textMuted
														}
													>
														{t.text.length > 80
															? t.text.slice(
																	0,
																	80,
																) + '…'
															: t.text}
													</Text>
												</Box>
												{isSelected && (
													<Box
														paddingLeft={4}
														gap={1}
													>
														<Text
															color={
																colors.textSubtle
															}
														>
															{t.episodeTitle}
														</Text>
													</Box>
												)}
											</Box>
										);
									})}
								</Box>
							)}
						</>
					)}

					<Box paddingTop={1} gap={2}>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>tab</Text> wissel tab
						</Text>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>backspace</Text> nieuwe
							zoekopdracht
						</Text>
					</Box>
				</Box>
			)}
		</ScreenContainer>
	);
}
