import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration } from '../theme/format.js';
import { usePlayer } from '../hooks/use-player.js';

export function PlayerBar() {
	const { isPlaying, currentEpisodeTitle, positionSeconds, durationSeconds } =
		usePlayer();

	if (!currentEpisodeTitle) return null;

	const icon = isPlaying ? '▶' : '⏸';

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
			<Text color={colors.textMuted}>
				{formatDuration(positionSeconds)} / {formatDuration(durationSeconds)}
			</Text>
		</Box>
	);
}
