import React from 'react';
import { Text } from 'ink';
import { colors } from '../theme/colors.js';

interface EmptyStateProps {
	message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
	return <Text color={colors.textMuted}>{message}</Text>;
}
