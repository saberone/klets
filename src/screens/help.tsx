import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { ScreenContainer } from '../components/screen-container.js';
import { useScrollableList } from '../hooks/use-scrollable-list.js';

interface KeyBinding {
	keys: string;
	description: string;
}

interface Section {
	title: string;
	bindings: KeyBinding[];
}

const sections: Section[] = [
	{
		title: 'Globaal',
		bindings: [
			{ keys: 'q', description: 'Afsluiten' },
			{ keys: 'esc', description: 'Terug' },
			{ keys: '?', description: 'Help (dit scherm)' },
			{ keys: 'space', description: 'Afspelen / pauzeren' },
			{ keys: '< >', description: '±15 seconden spoelen' },
		],
	},
	{
		title: 'Navigatie',
		bindings: [
			{ keys: 'j / ↓', description: 'Omlaag' },
			{ keys: 'k / ↑', description: 'Omhoog' },
			{ keys: 'h / ←', description: 'Vorige tab / pagina' },
			{ keys: 'l / →', description: 'Volgende tab / pagina' },
			{ keys: 'enter', description: 'Openen / selecteren' },
			{ keys: 'tab', description: 'Wissel focus' },
		],
	},
	{
		title: 'Aflevering',
		bindings: [
			{ keys: 'p', description: 'Afspelen / stoppen' },
			{ keys: 't', description: 'Transcript openen' },
			{ keys: 'o', description: 'Link openen in browser' },
			{ keys: 'b', description: 'Favoriet aan/uit' },
			{ keys: 'a', description: 'Toevoegen aan wachtrij' },
			{ keys: '[ ]', description: 'Vorig / volgend hoofdstuk' },
			{ keys: '- +', description: 'Afspeelsnelheid' },
		],
	},
	{
		title: 'Lijst',
		bindings: [
			{ keys: 's', description: 'Sorteer wijzigen' },
			{ keys: 'f', description: 'Filter wijzigen' },
		],
	},
	{
		title: 'Transcript',
		bindings: [
			{ keys: 'enter', description: 'Spring naar segment' },
			{ keys: 'f', description: 'Volg afspelen' },
		],
	},
	{
		title: 'Zoeken',
		bindings: [
			{ keys: 'tab', description: 'Wissel resultaat-tab' },
			{ keys: 'backspace', description: 'Nieuwe zoekopdracht' },
		],
	},
];

// Flatten sections into renderable lines for scrolling
interface RenderLine {
	type: 'header' | 'binding';
	text?: string;
	keys?: string;
	description?: string;
}

const lines: RenderLine[] = [];
for (const section of sections) {
	lines.push({ type: 'header', text: section.title });
	for (const binding of section.bindings) {
		lines.push({
			type: 'binding',
			keys: binding.keys,
			description: binding.description,
		});
	}
}

export function HelpScreen() {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const { visibleRange, hasMoreAbove, hasMoreBelow, aboveCount, belowCount } =
		useScrollableList(lines.length, selectedIndex);

	useInput((input, key) => {
		if (input === 'j' || key.downArrow) {
			setSelectedIndex((i) => Math.min(i + 1, lines.length - 1));
		} else if (input === 'k' || key.upArrow) {
			setSelectedIndex((i) => Math.max(i - 1, 0));
		}
	});

	return (
		<ScreenContainer>
			<Box paddingY={1}>
				<Text color={colors.cyan} bold>
					Sneltoetsen
				</Text>
			</Box>

			<Box flexDirection="column">
				{hasMoreAbove && (
					<Text color={colors.textSubtle} dimColor>
						{'  '}▲ {aboveCount} meer
					</Text>
				)}
				{lines.slice(visibleRange[0], visibleRange[1]).map((line, vi) => {
					const i = visibleRange[0] + vi;
					if (line.type === 'header') {
						return (
							<Box key={i} paddingTop={i > 0 ? 1 : 0}>
								<Text color={colors.purple} bold>
									{line.text}
								</Text>
							</Box>
						);
					}
					const isSelected = i === selectedIndex;
					return (
						<Box key={i} gap={1} paddingLeft={2}>
							<Text
								color={isSelected ? colors.cyan : colors.text}
								bold={isSelected}
							>
								{(line.keys ?? '').padEnd(12)}
							</Text>
							<Text
								color={
									isSelected
										? colors.text
										: colors.textMuted
								}
							>
								{line.description}
							</Text>
						</Box>
					);
				})}
				{hasMoreBelow && (
					<Text color={colors.textSubtle} dimColor>
						{'  '}▼ {belowCount} meer
					</Text>
				)}
			</Box>
		</ScreenContainer>
	);
}
