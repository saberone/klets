import React, { useState, useMemo } from 'react';
import { Box, Text } from 'ink';
import { useStableInput } from '../hooks/use-stable-input.js';
import { colors } from '../theme/colors.js';
import { formatDuration, formatRelativeDate } from '../theme/format.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { useScrollableList } from '../hooks/use-scrollable-list.js';
import { useFlashMessage } from '../hooks/use-flash-message.js';
import { useStore } from '../store/index.js';
import { sortHistory, type HistoryEntry } from '../store/history.js';
import { startEpisodePlayback } from '../player/start-episode.js';
import { ScreenContainer } from '../components/screen-container.js';
import { EmptyState } from '../components/empty-state.js';

/** "12:34 / 1:04:28", "12:34" (unknown duration) or "✓ beluisterd". */
export function formatHistoryProgress(entry: HistoryEntry): string {
	if (entry.completed) return '✓ beluisterd';
	const pos = formatDuration(entry.position);
	return entry.duration > 0
		? `${pos} / ${formatDuration(entry.duration)}`
		: pos;
}

export function HistoryScreen() {
	const { navigate } = useNavigation();
	const rawHistory = useStore((s) => s.history);
	const removeHistoryEntry = useStore((s) => s.removeHistoryEntry);
	const history = useMemo(() => sortHistory(rawHistory), [rawHistory]);
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [flash, showFlash] = useFlashMessage();
	const selected = Math.min(selectedIndex, Math.max(history.length - 1, 0));

	const { visibleRange, hasMoreAbove, hasMoreBelow, aboveCount, belowCount } =
		useScrollableList(history.length, selected);

	useStableInput((input, key) => {
		const entry = history[selected];
		if (input === 'j' || key.downArrow) {
			setSelectedIndex(Math.min(selected + 1, history.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex(Math.max(selected - 1, 0));
		} else if (key.return && entry) {
			navigate('episode-detail', { slug: entry.slug });
		} else if (input === 'p' && entry) {
			startEpisodePlayback(entry.slug, { startAt: 'resume' }).then((res) => {
				if (!res.ok) {
					showFlash(res.message, 'error', 3000);
				} else {
					showFlash(
						res.startAt > 0
							? `Hervat bij ${formatDuration(res.startAt)}`
							: 'Afspelen vanaf het begin',
						'success',
					);
				}
			});
		} else if (input === 'x' && entry) {
			removeHistoryEntry(entry.slug);
			if (selected >= history.length - 1 && selected > 0) {
				setSelectedIndex(selected - 1);
			}
		}
	});

	return (
		<ScreenContainer>
			<Box paddingY={1} gap={2}>
				<Text color={colors.cyan} bold>
					Geschiedenis
				</Text>
				<Text color={colors.textSubtle}>{history.length === 1 ? '1 aflevering' : `${history.length} afleveringen`}</Text>
			</Box>

			{flash && (
				<Box paddingBottom={1}>
					<Text
						color={flash.tone === 'error' ? colors.error : colors.success}
						bold
					>
						{flash.text}
					</Text>
				</Box>
			)}

			{history.length === 0 ? (
				<EmptyState message="Nog niets beluisterd. Afleveringen die je afspeelt verschijnen hier." />
			) : (
				<Box flexDirection="column">
					{hasMoreAbove && (
						<Text color={colors.textSubtle} dimColor>
							{'  '}▲ {aboveCount} meer
						</Text>
					)}
					{history.slice(visibleRange[0], visibleRange[1]).map((entry, vi) => {
						const i = visibleRange[0] + vi;
						const isSelected = i === selected;
						return (
							<Box key={entry.slug} gap={1} paddingLeft={1}>
								<Text color={isSelected ? colors.cyan : colors.textSubtle}>
									{isSelected ? '▸' : ' '}
								</Text>
								<Text
									color={isSelected ? colors.cyan : colors.text}
									bold={isSelected}
								>
									{entry.title}
								</Text>
								<Text color={entry.completed ? colors.success : colors.coral}>
									{formatHistoryProgress(entry)}
								</Text>
								<Text color={colors.textSubtle}>
									{formatRelativeDate(entry.lastPlayed)}
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

			{history.length > 0 && (
				<Box paddingTop={1} gap={2}>
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>enter</Text> openen
					</Text>
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>p</Text> verder luisteren
					</Text>
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>x</Text> verwijderen
					</Text>
				</Box>
			)}
		</ScreenContainer>
	);
}
