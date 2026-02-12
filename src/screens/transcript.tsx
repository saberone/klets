import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useApi } from '../hooks/use-api.js';
import { getTranscript } from '../api/episodes.js';
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

const PAGE_SIZE = 20;

export function TranscriptScreen() {
	const { current } = useNavigation();
	const slug = current.params?.['slug'] as string;
	const title = (current.params?.['title'] as string) ?? slug;
	const [offset, setOffset] = useState(0);

	const fetcher = useCallback(() => getTranscript(slug), [slug]);
	const { data, loading, error, refetch } = useApi<
		SingleResponse<TranscriptData>
	>(fetcher, `transcript-${slug}`, 10 * 60 * 1000);

	const segments = data?.data?.segments ?? [];
	const visible = segments.slice(offset, offset + PAGE_SIZE);
	const totalPages = Math.ceil(segments.length / PAGE_SIZE);
	const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

	useInput((input, key) => {
		if (loading) return;

		if (input === 'j' || key.downArrow) {
			setOffset((o) => Math.min(o + PAGE_SIZE, Math.max(0, segments.length - PAGE_SIZE)));
		} else if (input === 'k' || key.upArrow) {
			setOffset((o) => Math.max(o - PAGE_SIZE, 0));
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
			</Box>

			{segments.length === 0 ? (
				<Text color={colors.textMuted}>
					Geen transcript beschikbaar voor deze aflevering.
				</Text>
			) : (
				<>
					<Box flexDirection="column">
						{visible.map((seg) => {
							const speakerColor =
								seg.speaker === 'Saber'
									? colors.cyan
									: seg.speaker === 'Kishen'
										? colors.purple
										: colors.warning;
							return (
								<Box key={seg.segmentIndex} gap={1}>
									<Text color={colors.textSubtle}>
										{formatMs(seg.startTimeMs)}
									</Text>
									<Text color={speakerColor} bold>
										{(seg.speaker ?? '?').padEnd(10)}
									</Text>
									<Text color={colors.text}>{seg.text}</Text>
								</Box>
							);
						})}
					</Box>

					<Box paddingTop={1} gap={2}>
						<Text color={colors.textSubtle}>
							Pagina {currentPage}/{totalPages}
						</Text>
						<Text color={colors.textSubtle}>·</Text>
						<Text color={colors.textSubtle}>
							{segments.length} segmenten
						</Text>
						<Text color={colors.textSubtle}>
							<Text color={colors.cyan}>j/k</Text> scrollen
						</Text>
					</Box>
				</>
			)}
		</ScreenContainer>
	);
}
