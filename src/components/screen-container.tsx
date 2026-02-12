import React from 'react';
import { Box } from 'ink';

interface ScreenContainerProps {
	children: React.ReactNode;
}

export function ScreenContainer({ children }: ScreenContainerProps) {
	return (
		<Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={0}>
			{children}
		</Box>
	);
}
