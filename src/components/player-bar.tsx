import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration } from '../theme/format.js';
import { usePlayer } from '../hooks/use-player.js';
import {
	getDetectedBackend,
	isActive,
	getPosition,
} from '../player/index.js';

export function PlayerBar() {
	const { currentEpisodeTitle, durationSeconds } = usePlayer();
	const [position, setPosition] = useState(0);

	useEffect(() => {
		if (!currentEpisodeTitle) return;
		const timer = setInterval(() => {
			if (isActive()) {
				setPosition(getPosition());
			}
		}, 1000);
		return () => clearInterval(timer);
	}, [currentEpisodeTitle]);

	if (!currentEpisodeTitle) return null;

	const playing = isActive();
	const icon = playing ? '▶' : '■';
	const backend = getDetectedBackend();
	const showPosition = backend === 'mpv' && position > 0;

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
				{showPosition ? (
					<Text color={colors.textMuted}>
						{formatDuration(position)} / {formatDuration(durationSeconds)}
					</Text>
				) : (
					<Text color={colors.textMuted}>
						{formatDuration(durationSeconds)}
					</Text>
				)}
				{backend && (
					<Text color={colors.textSubtle}>via {backend}</Text>
				)}
			</Box>
		</Box>
	);
}
