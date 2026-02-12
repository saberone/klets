import { describe, it, expect } from 'vitest';
import { computeVisibleRange } from '../../src/hooks/use-scrollable-list.js';

describe('computeVisibleRange', () => {
	it('returns full range when all items fit', () => {
		const result = computeVisibleRange(5, 0, 10);
		expect(result.visibleRange).toEqual([0, 5]);
		expect(result.hasMoreAbove).toBe(false);
		expect(result.hasMoreBelow).toBe(false);
	});

	it('centers selection in viewport', () => {
		// 20 items, selected=10, viewport=5 → offset=8 (10-2), range [8, 13]
		const result = computeVisibleRange(20, 10, 5);
		expect(result.visibleRange).toEqual([8, 13]);
		expect(result.hasMoreAbove).toBe(true);
		expect(result.hasMoreBelow).toBe(true);
	});

	it('clamps at start', () => {
		const result = computeVisibleRange(20, 0, 5);
		expect(result.visibleRange).toEqual([0, 5]);
		expect(result.hasMoreAbove).toBe(false);
		expect(result.hasMoreBelow).toBe(true);
		expect(result.belowCount).toBe(15);
	});

	it('clamps at end', () => {
		const result = computeVisibleRange(20, 19, 5);
		expect(result.visibleRange).toEqual([15, 20]);
		expect(result.hasMoreAbove).toBe(true);
		expect(result.hasMoreBelow).toBe(false);
		expect(result.aboveCount).toBe(15);
	});

	it('handles zero items', () => {
		const result = computeVisibleRange(0, 0, 10);
		expect(result.visibleRange).toEqual([0, 0]);
		expect(result.hasMoreAbove).toBe(false);
		expect(result.hasMoreBelow).toBe(false);
	});

	it('handles viewport of 1', () => {
		const result = computeVisibleRange(10, 5, 1);
		expect(result.visibleRange).toEqual([5, 6]);
		expect(result.hasMoreAbove).toBe(true);
		expect(result.hasMoreBelow).toBe(true);
	});
});
