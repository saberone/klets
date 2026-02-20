import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { usePlayer } from '../hooks/use-player.js';
import { useApi } from '../hooks/use-api.js';
import { useScrollableList } from '../hooks/use-scrollable-list.js';
import { getTranscript } from '../api/episodes.js';
import { isActive, getPosition, seekAbsolute } from '../player/index.js';
import { ScreenContainer } from '../components/screen-container.js';
import { Loading } from '../components/loading.js';
import { ErrorDisplay } from '../components/error-display.js';
import type { TranscriptData, SingleResponse } from '../api/types.js';

function formatMs(ms: number): string {
	const totalSeconds = Math.floor(ms / 1000);
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${m}:${s.toString().padStart(2, '0')}`;
}

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
	const followingRef = useRef(following);
	followingRef.current = following;

	const fetcher = useCallback(() => getTranscript(slug), [slug]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<TranscriptData>
	>(fetcher, `transcript-${slug}`, 10 * 60 * 1000);

	const segments = data?.data?.segments ?? [];
	const isEpisodePlaying =
		player.currentEpisodeSlug === slug && isActive();

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

	useInput((input, key) => {
		if (loading) return;

		if (input === 'j' || key.downArrow) {
			setFollowing(false);
			setSelectedIndex((i) => Math.min(i + 1, segments.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setFollowing(false);
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return && isEpisodePlaying && segments[selectedIndex]) {
			seekAbsolute(segments[selectedIndex]!.startTimeMs / 1000);
			setFollowing(true);
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
								const speakerColor =
									seg.speaker === 'Saber'
										? colors.cyan
										: seg.speaker === 'Kishen'
											? colors.purple
											: colors.warning;
								const indicator = isActive ? '▸' : isSelected ? '›' : ' ';
								return (
									<Box key={seg.segmentIndex} gap={1}>
										<Text
											color={
												isActive
													? colors.cyan
													: isSelected
														? colors.purple
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
										<Text
											color={speakerColor}
											bold={highlighted}
											dimColor={!highlighted}
										>
											{(seg.speaker ?? '?').padEnd(10)}
										</Text>
										<Text
											color={
												highlighted
													? colors.text
													: colors.textMuted
											}
											bold={isActive}
										>
											{seg.text}
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

					<Box paddingTop={1} gap={2}>
						<Text color={colors.textSubtle}>
							{segments.length} segmenten
						</Text>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>j/k</Text> scrollen
						</Text>
						{isEpisodePlaying && (
							<Text color={colors.textSubtle}>
								<Text color={colors.cyan}>enter</Text> spring naar
							</Text>
						)}
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
