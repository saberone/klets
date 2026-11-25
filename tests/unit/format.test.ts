import { describe, it, expect } from 'vitest';
import {
	formatDuration,
	formatDate,
	formatEpisodeNumber,
	formatEpisodeLabel,
	episodeTypeBadge,
	formatMsLong,
	formatRelativeDate,
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

describe('null-safe formatting', () => {
	it('formatDuration returns empty string for null/undefined/NaN', () => {
		expect(formatDuration(null)).toBe('');
		expect(formatDuration(undefined)).toBe('');
		expect(formatDuration(Number.NaN)).toBe('');
	});

	it('formatDate returns empty string for null or invalid dates', () => {
		expect(formatDate(null)).toBe('');
		expect(formatDate('not a date')).toBe('');
	});

	it('formatEpisodeNumber never renders S00E00 for missing numbers', () => {
		expect(formatEpisodeNumber(null, null)).toBe('');
		expect(formatEpisodeNumber(1, null)).toBe('');
		expect(formatEpisodeNumber(null, 3)).toBe('');
	});
});

describe('episode type badge', () => {
	it('maps trailer and bonus to badges and full to null', () => {
		expect(episodeTypeBadge('trailer')).toBe('TRAILER');
		expect(episodeTypeBadge('bonus')).toBe('BONUS');
		expect(episodeTypeBadge('full')).toBeNull();
		expect(episodeTypeBadge(undefined)).toBeNull();
	});

	it('formatEpisodeLabel combines number and badge', () => {
		expect(
			formatEpisodeLabel({ seasonNumber: 1, episodeNumber: 5, episodeType: 'full' }),
		).toBe('S01E05');
		expect(
			formatEpisodeLabel({ seasonNumber: 2, episodeNumber: 1, episodeType: 'bonus' }),
		).toBe('S02E01 BONUS');
		expect(
			formatEpisodeLabel({ seasonNumber: null, episodeNumber: null, episodeType: 'trailer' }),
		).toBe('TRAILER');
		expect(formatEpisodeLabel({ seasonNumber: null, episodeNumber: null })).toBe('');
	});
});

describe('formatMsLong', () => {
	it('always shows hours', () => {
		expect(formatMsLong(0)).toBe('0:00:00');
		expect(formatMsLong(13_996)).toBe('0:00:13');
		expect(formatMsLong(3_723_000)).toBe('1:02:03');
	});
});

describe('formatRelativeDate', () => {
	const now = new Date(2026, 10, 25, 12, 0, 0);
	it('uses Dutch relative words for recent dates', () => {
		expect(formatRelativeDate(new Date(2026, 10, 25, 8).toISOString(), now)).toBe('vandaag');
		expect(formatRelativeDate(new Date(2026, 10, 24, 23).toISOString(), now)).toBe('gisteren');
		expect(formatRelativeDate(new Date(2026, 10, 22, 9).toISOString(), now)).toBe('3 dagen geleden');
	});

	it('falls back to a formatted date for older entries and handles missing values', () => {
		expect(formatRelativeDate(new Date(2026, 0, 2).toISOString(), now)).toMatch(/2026/);
		expect(formatRelativeDate('', now)).toBe('');
		expect(formatRelativeDate(null, now)).toBe('');
	});
});
