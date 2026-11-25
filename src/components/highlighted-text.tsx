import React from 'react';
import { Text } from 'ink';
import { colors } from '../theme/colors.js';

interface HighlightedTextProps {
	text: string;
	/** [start, end) ranges to highlight (sorted, non-overlapping) */
	ranges: [number, number][];
	color?: string;
	bold?: boolean;
	dimColor?: boolean;
}

/** Text with search matches highlighted. */
export function HighlightedText({
	text,
	ranges,
	color,
	bold,
	dimColor,
}: HighlightedTextProps) {
	if (ranges.length === 0) {
		return (
			<Text color={color} bold={bold} dimColor={dimColor}>
				{text}
			</Text>
		);
	}
	const parts: React.ReactNode[] = [];
	let pos = 0;
	ranges.forEach(([start, end], i) => {
		if (start > pos) parts.push(text.slice(pos, start));
		parts.push(
			<Text key={i} backgroundColor={colors.coral} color={colors.bg} bold>
				{text.slice(start, end)}
			</Text>,
		);
		pos = end;
	});
	if (pos < text.length) parts.push(text.slice(pos));
	return (
		<Text color={color} bold={bold} dimColor={dimColor}>
			{parts}
		</Text>
	);
}
