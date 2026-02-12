import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { colors } from '../theme/colors.js';

interface LoadingProps {
	message?: string;
}

export function Loading({ message = 'Laden...' }: LoadingProps) {
	return (
		<Box paddingY={1}>
			<Text color={colors.cyan}>
				<Spinner type="dots" />
			</Text>
			<Text color={colors.textMuted}> {message}</Text>
		</Box>
	);
}
