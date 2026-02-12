import { useMemo } from 'react';

/**
 * Overhead lines taken by header (3), footer (3), player-bar (3),
 * screen title/padding (~3), and scroll indicators (2).
 */
const LIST_OVERHEAD = 14;

interface ScrollableResult {
	/** [startIndex, endIndex) — use to slice the items array */
	visibleRange: [number, number];
	hasMoreAbove: boolean;
	hasMoreBelow: boolean;
	aboveCount: number;
	belowCount: number;
}

export function useScrollableList(
	itemCount: number,
	selectedIndex: number,
	options?: { maxVisible?: number; linesPerItem?: number },
): ScrollableResult {
	const terminalRows = process.stdout.rows || 24;
	const linesPerItem = options?.linesPerItem ?? 1;
	const availableItems = Math.floor((terminalRows - LIST_OVERHEAD) / linesPerItem);
	const viewportSize = options?.maxVisible ?? Math.max(3, availableItems);

	return useMemo(() => {
		if (itemCount <= viewportSize) {
			return {
				visibleRange: [0, itemCount] as [number, number],
				hasMoreAbove: false,
				hasMoreBelow: false,
				aboveCount: 0,
				belowCount: 0,
			};
		}

		// Keep selected item roughly centered in the viewport
		const halfView = Math.floor(viewportSize / 2);
		let offset = selectedIndex - halfView;
		offset = Math.max(0, offset);
		offset = Math.min(itemCount - viewportSize, offset);

		const end = offset + viewportSize;
		return {
			visibleRange: [offset, end] as [number, number],
			hasMoreAbove: offset > 0,
			hasMoreBelow: end < itemCount,
			aboveCount: offset,
			belowCount: itemCount - end,
		};
	}, [itemCount, selectedIndex, viewportSize]);
}
