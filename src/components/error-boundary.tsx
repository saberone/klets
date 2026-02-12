import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface Props {
	children: React.ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { hasError: false, error: null };
	}

	static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error) {
		process.stderr.write(`[klets] Onverwachte fout: ${error.message}\n`);
		if (error.stack) {
			process.stderr.write(`${error.stack}\n`);
		}
	}

	render() {
		if (this.state.hasError) {
			return (
				<Box flexDirection="column" paddingY={1} paddingX={1}>
					<Text color={colors.error} bold>
						Er is iets misgegaan
					</Text>
					{this.state.error && (
						<Text color={colors.textMuted}>
							{this.state.error.message}
						</Text>
					)}
					<Box paddingTop={1}>
						<Text color={colors.textSubtle}>
							Druk op <Text color={colors.cyan}>esc</Text> om terug te gaan
						</Text>
					</Box>
				</Box>
			);
		}

		return this.props.children;
	}
}
