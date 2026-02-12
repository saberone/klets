import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface ErrorDisplayProps {
	message: string;
	onRetry?: () => void;
}

export function ErrorDisplay({ message, onRetry }: ErrorDisplayProps) {
	return (
		<Box flexDirection="column" paddingY={1}>
			<Text color={colors.error}>Fout: {message}</Text>
			{onRetry && (
				<Text color={colors.textSubtle}>Druk op r om opnieuw te proberen</Text>
			)}
		</Box>
	);
}
