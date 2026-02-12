import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration } from '../theme/format.js';
import { usePlayer } from '../hooks/use-player.js';
import { getDetectedBackend, isActive } from '../player/index.js';

export function PlayerBar() {
	const { currentEpisodeTitle, durationSeconds } = usePlayer();

	if (!currentEpisodeTitle) return null;

	const playing = isActive();
	const icon = playing ? '▶' : '■';
	const backend = getDetectedBackend();

	return (
		<Box
			borderStyle="single"
			borderColor={colors.purple}
			paddingX={1}
			justifyContent="space-between"
		>
			<Box gap={1}>
				<Text color={colors.purple}>{icon}</Text>
				<Text color={colors.text} bold>
					{currentEpisodeTitle}
				</Text>
			</Box>
			<Box gap={2}>
				<Text color={colors.textMuted}>
					{formatDuration(durationSeconds)}
				</Text>
				{backend && (
					<Text color={colors.textSubtle}>via {backend}</Text>
				)}
			</Box>
		</Box>
	);
}
