import React from 'react';
import { Text } from 'ink';
import { colors } from '../theme/colors.js';

interface TagPillProps {
	name: string;
}

export function TagPill({ name }: TagPillProps) {
	return (
		<Text color={colors.purple}>
			[{name}]
		</Text>
	);
}
