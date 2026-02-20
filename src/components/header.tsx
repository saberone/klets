import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import type { ScreenName } from '../store/navigation.js';

const screenLabels: Record<ScreenName, string> = {
	home: 'Home',
	'episodes-list': 'Afleveringen',
	'episode-detail': 'Aflevering',
	transcript: 'Transcript',
	'topics-list': 'Onderwerpen',
	'topic-detail': 'Onderwerp',
	'persons-list': 'Personen',
	'person-detail': 'Persoon',
	search: 'Zoeken',
	help: 'Help',
	favorites: 'Favorieten',
};

export function Header() {
	const { stack } = useNavigation();
	const breadcrumb = stack.map((entry) => screenLabels[entry.screen]);

	return (
		<Box borderStyle="single" borderColor={colors.border} paddingX={1}>
			<Text color={colors.cyan} bold>
				{'{ '}
			</Text>
			<Text color={colors.text} bold>
				klets
			</Text>
			<Text color={colors.cyan} bold>
				{' }'}
			</Text>
			<Text color={colors.textSubtle}> / </Text>
			{breadcrumb.map((label, i) => (
				<React.Fragment key={i}>
					{i > 0 && <Text color={colors.textSubtle}> &gt; </Text>}
					<Text
						color={
							i === breadcrumb.length - 1 ? colors.cyan : colors.textMuted
						}
					>
						{label}
					</Text>
				</React.Fragment>
			))}
		</Box>
	);
}
