import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { HighlightedText } from '../../src/components/highlighted-text.js';
import {
	foldText,
	findMatchRanges,
	findMatchingSegments,
	firstMatchFrom,
	stepMatch,
	matchCounter,
	textMatches,
} from '../../src/utils/text-search.js';

describe('foldText', () => {
	it('lowercases and strips diacritics, keeping a map to the original', () => {
		const { folded, map } = foldText('Café Über');
		expect(folded).toBe('cafe uber');
		expect(map[3]).toEqual([3, 4]);
	});

	it('handles decomposed input (e + combining accent)', () => {
		expect(foldText('Cafe\u{301}').folded).toBe('cafe');
	});
});

describe('findMatchRanges', () => {
	it('matches case- and diacritics-insensitively and maps back to the original text', () => {
		const text = 'Vandaag over Café React';
		const ranges = findMatchRanges(text, 'cafe');
		expect(ranges).toEqual([[13, 17]]);
		expect(text.slice(13, 17)).toBe('Café');
	});

	it('maps ranges correctly when the original contains decomposed characters', () => {
		const text = 'een cafe\u{301} hier';
		const [range] = findMatchRanges(text, 'CAFÉ');
		expect(text.slice(range![0], range![1])).toBe('cafe\u{301}');
	});

	it('finds every non-overlapping occurrence', () => {
		expect(findMatchRanges('React, react en REACT', 'react')).toEqual([
			[0, 5],
			[7, 12],
			[16, 21],
		]);
	});

	it('returns nothing for an empty query', () => {
		expect(findMatchRanges('tekst', '  ')).toEqual([]);
		expect(textMatches('tekst', '')).toBe(false);
	});
});

describe('findMatchingSegments', () => {
	const segments = [
		{ text: 'Welkom bij CodeKlets', speaker: 'Kishen Simbhoedatpanday' },
		{ text: 'Vandaag over Café React', speaker: 'Saber Karmous' },
		{ text: 'over react hooks', speaker: null },
	];

	it('matches on text and on speaker', () => {
		expect(findMatchingSegments(segments, 'react')).toEqual([1, 2]);
		expect(findMatchingSegments(segments, 'KISHEN')).toEqual([0]);
		expect(findMatchingSegments(segments, 'cafe')).toEqual([1]);
		expect(findMatchingSegments(segments, 'zzz')).toEqual([]);
		expect(findMatchingSegments(segments, '')).toEqual([]);
	});
});

describe('match navigation', () => {
	const matches = [2, 5, 9];

	it('firstMatchFrom finds the first match at or after a position, wrapping', () => {
		expect(firstMatchFrom(matches, 0)).toBe(2);
		expect(firstMatchFrom(matches, 5)).toBe(5);
		expect(firstMatchFrom(matches, 6)).toBe(9);
		expect(firstMatchFrom(matches, 10)).toBe(2);
		expect(firstMatchFrom([], 3)).toBe(-1);
	});

	it('n / N step forward and back with wrap-around', () => {
		expect(stepMatch(matches, 2, 1)).toBe(5);
		expect(stepMatch(matches, 9, 1)).toBe(2);
		expect(stepMatch(matches, 3, 1)).toBe(5);
		expect(stepMatch(matches, 5, -1)).toBe(2);
		expect(stepMatch(matches, 2, -1)).toBe(9);
		expect(stepMatch([], 0, 1)).toBe(-1);
	});

	it('counter shows position/total', () => {
		expect(matchCounter(matches, 5)).toBe('2/3');
		expect(matchCounter(matches, 4)).toBe('–/3');
	});
});

describe('HighlightedText', () => {
	it('renders the full text with highlighted ranges', () => {
		const text = 'Vandaag over Café React';
		const { lastFrame } = render(
			<HighlightedText text={text} ranges={findMatchRanges(text, 'cafe')} />,
		);
		expect(lastFrame()).toContain(text);
	});
});
