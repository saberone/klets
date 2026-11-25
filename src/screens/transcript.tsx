import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { formatMs } from '../theme/format.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { usePlayer } from '../hooks/use-player.js';
import { useApi } from '../hooks/use-api.js';
import { useScrollableList } from '../hooks/use-scrollable-list.js';
import { useInputCapture } from '../hooks/use-input-capture.js';
import { getTranscript } from '../api/episodes.js';
import { isActive, getPosition, seekAbsolute } from '../player/index.js';
import { startEpisodePlayback } from '../player/start-episode.js';
import { useFlashMessage } from '../hooks/use-flash-message.js';
import { useShareLink } from '../hooks/use-share-link.js';
import { buildSegmentUrl } from '../utils/share-url.js';
import {
	findMatchingSegments,
	findMatchRanges,
	firstMatchFrom,
	stepMatch,
	matchCounter,
} from '../utils/text-search.js';
import { ScreenContainer } from '../components/screen-container.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import { HighlightedText } from '../components/highlighted-text.js';
import type { TranscriptData, SingleResponse } from '../api/types.js';

/** off: no search · typing: the "/" input is open · active: a confirmed search */
type SearchMode = 'off' | 'typing' | 'active';

export function TranscriptScreen() {
	const { current } = useNavigation();
	const slug = current.params?.['slug'] as string;
	const title = (current.params?.['title'] as string) ?? slug;
	const seekMs = current.params?.['seekMs'] as number | undefined;
	const player = usePlayer();
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [following, setFollowing] = useState(true);
	const [activeSegmentIndex, setActiveSegmentIndex] = useState(-1);
	const [didInitialSeek, setDidInitialSeek] = useState(false);
	const [searchMode, setSearchMode] = useState<SearchMode>('off');
	const [draft, setDraft] = useState('');
	const [query, setQuery] = useState('');
	const [flash, showFlash] = useFlashMessage();
	const share = useShareLink(showFlash);
	const followingRef = useRef(following);
	followingRef.current = following;

	// Typing: all global keys off. Active search: esc clears it instead of going back.
	useInputCapture(
		searchMode === 'typing' ? 'all' : searchMode === 'active' ? 'escape' : 'none',
	);

	const fetcher = useCallback(() => getTranscript(slug), [slug]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<TranscriptData>
	>(fetcher, `transcript-${slug}`, 10 * 60 * 1000);

	const segments = useMemo(() => data?.data?.segments ?? [], [data]);
	const isEpisodePlaying =
		player.currentEpisodeSlug === slug && isActive();

	const matches = useMemo(
		() => (searchMode === 'active' ? findMatchingSegments(segments, query) : []),
		[segments, query, searchMode],
	);
	const matchSet = useMemo(() => new Set(matches), [matches]);

	// Seek to initial position from search result
	useEffect(() => {
		if (didInitialSeek || !seekMs || segments.length === 0) return;
		setDidInitialSeek(true);
		const idx = findSegmentAtTime(segments, seekMs);
		if (idx >= 0) {
			setSelectedIndex(idx);
			setFollowing(false);
		}
	}, [seekMs, segments, didInitialSeek]);

	// Poll player position and find matching segment
	useEffect(() => {
		if (!isEpisodePlaying || segments.length === 0) {
			setActiveSegmentIndex(-1);
			return;
		}

		const tick = () => {
			const posMs = getPosition() * 1000;
			const idx = findSegmentAtTime(segments, posMs);
			setActiveSegmentIndex(idx);
			if (idx >= 0 && followingRef.current) {
				setSelectedIndex(idx);
			}
		};

		tick();
		const timer = setInterval(tick, 300);
		return () => clearInterval(timer);
	}, [isEpisodePlaying, segments]);

	const { visibleRange, hasMoreAbove, hasMoreBelow, aboveCount, belowCount } =
		useScrollableList(segments.length, selectedIndex);

	// Ink re-subscribes input handlers in an effect; a keystroke that arrives
	// right after a state change (e.g. "enter" then "n") may reach the previous
	// handler. Reading through a ref, updated on every render, avoids stale state.
	const latest = useRef({ searchMode, draft, matches, selectedIndex, segments });
	latest.current = { searchMode, draft, matches, selectedIndex, segments };

	const jumpTo = (index: number) => {
		if (index < 0) return;
		setFollowing(false);
		setSelectedIndex(index);
	};

	const clearSearch = () => {
		setSearchMode('off');
		setDraft('');
		setQuery('');
	};

	useInput((input, key) => {
		if (loading) return;
		const { searchMode, draft, matches, selectedIndex, segments } = latest.current;

		// ── "/" input open: every key edits the query ──
		if (searchMode === 'typing') {
			if (key.escape) {
				clearSearch();
			} else if (key.return) {
				const q = draft.trim();
				if (!q) {
					clearSearch();
					return;
				}
				setQuery(q);
				setSearchMode('active');
				const found = findMatchingSegments(segments, q);
				jumpTo(firstMatchFrom(found, selectedIndex));
			} else if (key.backspace || key.delete) {
				setDraft((d) => d.slice(0, -1));
			} else if (input && !key.ctrl && !key.meta && !key.tab) {
				setDraft((d) => d + input);
			}
			return;
		}

		if (input === '/') {
			setDraft('');
			setSearchMode('typing');
			return;
		}

		if (searchMode === 'active') {
			if (key.escape) {
				clearSearch();
				return;
			}
			if (input === 'n') {
				jumpTo(stepMatch(matches, selectedIndex, 1));
				return;
			}
			if (input === 'N') {
				jumpTo(stepMatch(matches, selectedIndex, -1));
				return;
			}
		}

		if (input === 'j' || key.downArrow) {
			setFollowing(false);
			setSelectedIndex((i) => Math.min(i + 1, segments.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setFollowing(false);
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && segments[selectedIndex]) {
			const startSec = segments[selectedIndex]!.startTimeMs / 1000;
			if (isEpisodePlaying) {
				seekAbsolute(startSec);
			} else {
				startEpisodePlayback(slug, { startAt: startSec }).then((res) => {
					if (!res.ok) showFlash(res.message, 'error', 3000);
				});
			}
			setFollowing(true);
		} else if (input === 'y' && segments[selectedIndex]) {
			share(buildSegmentUrl(slug, segments[selectedIndex]!.startTimeMs));
		} else if (input === 'f' && isEpisodePlaying) {
			setFollowing(true);
			if (activeSegmentIndex >= 0) {
				setSelectedIndex(activeSegmentIndex);
			}
		} else if (input === 'r' && error) {
			refetch();
		}
	});

	if (loading) return <Loading message="Transcript laden..." />;
	if (error) return <ErrorDisplay message={error} onRetry={refetch} />;

	return (
		<ScreenContainer>
			<Box paddingY={1} gap={2}>
				<Text color={colors.cyan} bold>
					Transcript
				</Text>
				<Text color={colors.textMuted}>{title}</Text>
				{isEpisodePlaying && (
					<Text color={following ? colors.success : colors.textSubtle}>
						{following ? '● volgt' : '○ gepauzeerd'}
					</Text>
				)}
			</Box>

			{flash && (
				<Box paddingBottom={1}>
					<Text color={flash.tone === 'error' ? colors.error : colors.success} bold>
						{flash.text}
					</Text>
				</Box>
			)}

			{segments.length === 0 ? (
				<Text color={colors.textMuted}>
					Geen transcript beschikbaar voor deze aflevering.
				</Text>
			) : (
				<>
					<Box flexDirection="column">
						{hasMoreAbove && (
							<Text color={colors.textSubtle} dimColor>
								{'  '}▲ {aboveCount} meer
							</Text>
						)}
						{segments
							.slice(visibleRange[0], visibleRange[1])
							.map((seg, vi) => {
								const i = visibleRange[0] + vi;
								const isSelected = i === selectedIndex;
								const isActive = i === activeSegmentIndex;
								const highlighted = isSelected || isActive;
								const speakerColor = speakerColorFor(seg.speaker);
								const indicator = isActive ? '▸' : isSelected ? '›' : ' ';
								const isMatch = matchSet.has(i);
								const speakerLabel = (seg.speaker ?? '?').padEnd(10);
								return (
									<Box key={seg.segmentIndex} gap={1}>
										<Text
											color={
												isActive
													? colors.cyan
													: isSelected
														? colors.coral
														: colors.textSubtle
											}
										>
											{indicator}
										</Text>
										<Text
											color={
												highlighted
													? colors.text
													: colors.textSubtle
											}
										>
											{formatMs(seg.startTimeMs)}
										</Text>
										<HighlightedText
											text={speakerLabel}
											ranges={isMatch ? findMatchRanges(speakerLabel, query) : []}
											color={speakerColor}
											bold={highlighted}
											dimColor={!highlighted}
										/>
										<HighlightedText
											text={seg.text}
											ranges={isMatch ? findMatchRanges(seg.text, query) : []}
											color={highlighted ? colors.text : colors.textMuted}
											bold={isActive}
										/>
									</Box>
								);
							})}
						{hasMoreBelow && (
							<Text color={colors.textSubtle} dimColor>
								{'  '}▼ {belowCount} meer
							</Text>
						)}
					</Box>

					{searchMode === 'typing' && (
						<Box paddingTop={1} gap={1}>
							<Text color={colors.cyan} bold>
								/
							</Text>
							<Text color={colors.text}>
								{draft}
								<Text color={colors.cyan}>▌</Text>
							</Text>
							<Text color={colors.textSubtle}>
								<Text color={colors.cyan}>enter</Text> zoek{' '}
								<Text color={colors.cyan}>esc</Text> annuleer
							</Text>
						</Box>
					)}

					{searchMode === 'active' && (
						<Box paddingTop={1} gap={2}>
							<Text color={colors.cyan} bold>
								/{query}
							</Text>
							{matches.length === 0 ? (
								<Text color={colors.warning}>Geen resultaten</Text>
							) : (
								<Text color={colors.text} bold>
									{matchCounter(matches, selectedIndex)}
								</Text>
							)}
							{matches.length > 0 && (
								<Text color={colors.textSubtle}>
									<Text color={colors.cyan}>n/N</Text> volgende/vorige
								</Text>
							)}
							<Text color={colors.textSubtle}>
								<Text color={colors.cyan}>esc</Text> wis zoekopdracht
							</Text>
						</Box>
					)}

					<Box paddingTop={1} gap={2}>
						<Text color={colors.textSubtle}>
							{segments.length} segmenten
						</Text>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>j/k</Text> scrollen
						</Text>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>enter</Text>{' '}
							{isEpisodePlaying ? 'spring naar' : 'afspelen'}
						</Text>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>/</Text> zoeken
						</Text>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>y</Text> deel link
						</Text>
						{isEpisodePlaying && !following && (
							<Text color={colors.textSubtle}>
								<Text color={colors.cyan}>f</Text> volg afspelen
							</Text>
						)}
					</Box>
				</>
			)}
		</ScreenContainer>
	);
}

/** Hosts get fixed colours; speakers are full names ("Saber Karmous") in the API. */
function speakerColorFor(speaker: string | null): string {
	const first = speaker?.split(' ')[0];
	if (first === 'Saber') return colors.cyan;
	if (first === 'Kishen') return colors.coral;
	return colors.warning;
}

function findSegmentAtTime(
	segments: { startTimeMs: number; endTimeMs: number }[],
	posMs: number,
): number {
	for (let i = segments.length - 1; i >= 0; i--) {
		if (posMs >= segments[i]!.startTimeMs) {
			return i;
		}
	}
	return -1;
}
