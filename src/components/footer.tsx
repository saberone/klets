import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';

export function Footer() {
	const { stack, current } = useNavigation();
	const canGoBack = stack.length > 1;
	const isDetail =
		current.screen === 'episode-detail' ||
		current.screen === 'person-detail';

	return (
		<Box
			borderStyle="single"
			borderColor={colors.border}
			paddingX={1}
			justifyContent="space-between"
		>
			<Box gap={2}>
				{canGoBack && (
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>esc</Text> terug
					</Text>
				)}
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>j/k</Text> navigeer
				</Text>
				{!isDetail && (
					<Text color={colors.textSubtle}>
						<Text color={colors.cyan}>enter</Text> open
					</Text>
				)}
			</Box>
			<Box gap={2}>
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>?</Text> help
				</Text>
				<Text color={colors.textSubtle}>
					<Text color={colors.cyan}>q</Text> stop
				</Text>
			</Box>
		</Box>
	);
}
