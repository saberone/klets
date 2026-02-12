import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { useNavigation } from '../hooks/use-navigation.js';
import { ScreenContainer } from '../components/screen-container.js';

const BANNER_CODE = `\
 ██████╗ ██████╗ ██████╗ ███████╗
██╔════╝██╔═══██╗██╔══██╗██╔════╝
██║     ██║   ██║██║  ██║█████╗
██║     ██║   ██║██║  ██║██╔══╝
╚██████╗╚██████╔╝██████╔╝███████╗
 ╚═════╝ ╚═════╝ ╚═════╝ ╚══════╝`;

const BANNER_KLETS = `\
██╗  ██╗██╗     ███████╗████████╗███████╗
██║ ██╔╝██║     ██╔════╝╚══██╔══╝██╔════╝
█████╔╝ ██║     █████╗     ██║   ███████╗
██╔═██╗ ██║     ██╔══╝     ██║   ╚════██║
██║  ██╗███████╗███████╗   ██║   ███████║
╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝   ╚══════╝`;

interface MenuItem {
	label: string;
	screen: 'episodes-list' | 'topics-list' | 'persons-list' | 'search';
	description: string;
}

const menuItems: MenuItem[] = [
	{
		label: 'Afleveringen',
		screen: 'episodes-list',
		description: 'Bekijk alle afleveringen',
	},
	{
		label: 'Onderwerpen',
		screen: 'topics-list',
		description: 'Browse op onderwerp',
	},
	{
		label: 'Personen',
		screen: 'persons-list',
		description: 'Gasten en hosts',
	},
	{
		label: 'Zoeken',
		screen: 'search',
		description: 'Zoek in afleveringen',
	},
];

export function HomeScreen() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { navigate } = useNavigation();

	useInput((input, key) => {
		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, menuItems.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		} else if (key.return) {
			const item = menuItems[selectedIndex]!;
			navigate(item.screen);
		}
	});

	return (
		<ScreenContainer>
			<Box flexDirection="column" alignItems="center" paddingY={1}>
				<Text color={colors.cyan}>{BANNER_CODE}</Text>
				<Text color={colors.purple}>{BANNER_KLETS}</Text>
				<Box paddingTop={1}>
					<Text color={colors.textMuted} italic>
						// Nederlandse Podcast voor Developers
					</Text>
				</Box>
			</Box>

			<Box
				flexDirection="column"
				paddingY={1}
				paddingX={2}
				alignItems="center"
			>
				{menuItems.map((item, i) => {
					const isSelected = i === selectedIndex;
					return (
						<Box key={item.screen} gap={1}>
							<Text color={isSelected ? colors.cyan : colors.textSubtle}>
								{isSelected ? '▸' : ' '}
							</Text>
							<Text
								color={isSelected ? colors.cyan : colors.text}
								bold={isSelected}
							>
								{item.label}
							</Text>
							{isSelected && (
								<Text color={colors.textMuted}> — {item.description}</Text>
							)}
						</Box>
					);
				})}
			</Box>
		</ScreenContainer>
	);
}
