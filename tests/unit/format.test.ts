import { describe, it, expect } from 'vitest';
import {
	formatDuration,
	formatDate,
	formatEpisodeNumber,
} from '../../src/theme/format.js';

describe('formatDuration', () => {
	it('formats 0 seconds', () => {
		expect(formatDuration(0)).toBe('0:00');
	});

	it('formats seconds only', () => {
		expect(formatDuration(45)).toBe('0:45');
	});

	it('formats minutes and seconds', () => {
		expect(formatDuration(754)).toBe('12:34');
	});

	it('formats hours, minutes, and seconds', () => {
		expect(formatDuration(5025)).toBe('1:23:45');
	});

	it('pads single-digit seconds', () => {
		expect(formatDuration(61)).toBe('1:01');
	});

	it('pads single-digit minutes in hour format', () => {
		expect(formatDuration(3605)).toBe('1:00:05');
	});
});

describe('formatDate', () => {
	it('formats ISO date to Dutch locale', () => {
		const result = formatDate('2024-01-12T00:00:00Z');
		expect(result).toMatch(/12/);
		expect(result).toMatch(/2024/);
	});
});

describe('formatEpisodeNumber', () => {
	it('pads single digits', () => {
		expect(formatEpisodeNumber(1, 5)).toBe('S01E05');
	});

	it('handles double digits', () => {
		expect(formatEpisodeNumber(2, 12)).toBe('S02E12');
	});

	it('handles large numbers', () => {
		expect(formatEpisodeNumber(10, 100)).toBe('S10E100');
	});
});
