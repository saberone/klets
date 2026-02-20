import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { formatDuration } from '../theme/format.js';
import { usePlayer } from '../hooks/use-player.js';
import { useTerminalSize } from '../hooks/use-terminal-size.js';
import {
	getDetectedBackend,
	isActive,
	getPosition,
} from '../player/index.js';

function ProgressBar({
	position,
	duration,
	width,
}: {
	position: number;
	duration: number;
	width: number;
}) {
	const progress = duration > 0 ? Math.min(position / duration, 1) : 0;
	const filled = Math.round(progress * width);
	const empty = width - filled;

	return (
		<Text>
			<Text color={colors.purple}>{'━'.repeat(filled)}</Text>
			<Text color={colors.border}>{'━'.repeat(empty)}</Text>
		</Text>
	);
}

export function PlayerBar() {
	const { currentEpisodeTitle, durationSeconds, playbackSpeed, queue } =
		usePlayer();
	const { columns } = useTerminalSize();
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

	// Full inner width: terminal minus border (2) and paddingX (2)
	const barWidth = columns - 4;

	return (
		<Box
			borderStyle="single"
			borderColor={colors.purple}
			paddingX={1}
			flexDirection="column"
		>
			<Box justifyContent="space-between">
				<Box gap={1}>
					<Text color={colors.purple}>{icon}</Text>
					<Text color={colors.text} bold>
						{currentEpisodeTitle}
					</Text>
				</Box>
				<Box gap={2}>
					{showPosition ? (
						<Text color={colors.textMuted}>
							{formatDuration(position)} /{' '}
							{formatDuration(durationSeconds)}
						</Text>
					) : (
						<Text color={colors.textMuted}>
							{formatDuration(durationSeconds)}
						</Text>
					)}
					{playbackSpeed !== 1 && (
						<Text color={colors.purple} bold>
							{playbackSpeed}x
						</Text>
					)}
					{queue.length > 0 && (
						<Text color={colors.textMuted}>
							+{queue.length} in wachtrij
						</Text>
					)}
					{backend && (
						<Text color={colors.textSubtle}>via {backend}</Text>
					)}
				</Box>
			</Box>
			{showPosition && barWidth > 0 && (
				<ProgressBar
					position={position}
					duration={durationSeconds}
					width={barWidth}
				/>
			)}
		</Box>
	);
}
