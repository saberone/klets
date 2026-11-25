/**
 * Case- and diacritics-insensitive text search ("cafe" finds "Café"),
 * with match ranges mapped back to the original string for highlighting.
 */

const COMBINING_MARKS = /\p{M}/gu;

export interface FoldedText {
	/** Lowercased text without diacritics */
	folded: string;
	/** For every code unit in `folded`: [start, end) of the source character in the original */
	map: [number, number][];
}

/** Folds text character by character, keeping an index map to the original. */
export function foldText(text: string): FoldedText {
	let folded = '';
	const map: [number, number][] = [];
	let i = 0;
	for (const ch of text) {
		const start = i;
		const end = i + ch.length;
		i = end;
		const f = ch.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
		if (f.length === 0 && map.length > 0) {
			// A lone combining mark (decomposed input): attach it to the previous
			// character so highlights never split "e" from its accent.
			const prevStart = map[map.length - 1]![0];
			for (let k = map.length - 1; k >= 0 && map[k]![0] === prevStart; k--) {
				map[k] = [prevStart, end];
			}
			continue;
		}
		for (let k = 0; k < f.length; k++) map.push([start, end]);
		folded += f;
	}
	return { folded, map };
}

export function normalizeQuery(query: string): string {
	return foldText(query.trim()).folded;
}

/** [start, end) ranges in the original `text` where `query` matches (non-overlapping). */
export function findMatchRanges(
	text: string,
	query: string,
): [number, number][] {
	const q = normalizeQuery(query);
	if (!q || !text) return [];
	const { folded, map } = foldText(text);
	const ranges: [number, number][] = [];
	let from = 0;
	for (;;) {
		const at = folded.indexOf(q, from);
		if (at === -1) break;
		const start = map[at]![0];
		const end = map[at + q.length - 1]![1];
		ranges.push([start, end]);
		from = at + q.length;
	}
	return ranges;
}

export function textMatches(
	text: string | null | undefined,
	query: string,
): boolean {
	const q = normalizeQuery(query);
	if (!q || !text) return false;
	return foldText(text).folded.includes(q);
}

/** Indices of segments whose text or speaker matches the query. */
export function findMatchingSegments(
	segments: { text: string; speaker: string | null }[],
	query: string,
): number[] {
	if (!normalizeQuery(query)) return [];
	const result: number[] = [];
	segments.forEach((seg, i) => {
		if (textMatches(seg.text, query) || textMatches(seg.speaker, query)) {
			result.push(i);
		}
	});
	return result;
}

/** First match at or after `from`, wrapping to the first match; -1 without matches. */
export function firstMatchFrom(matches: number[], from: number): number {
	if (matches.length === 0) return -1;
	return matches.find((m) => m >= from) ?? matches[0]!;
}

/** Next (n) or previous (N) match relative to `current`, wrapping around; -1 without matches. */
export function stepMatch(
	matches: number[],
	current: number,
	direction: 1 | -1,
): number {
	if (matches.length === 0) return -1;
	if (direction === 1) {
		return matches.find((m) => m > current) ?? matches[0]!;
	}
	for (let i = matches.length - 1; i >= 0; i--) {
		if (matches[i]! < current) return matches[i]!;
	}
	return matches[matches.length - 1]!;
}

/** "3/17" when `current` is a match, "–/17" otherwise. */
export function matchCounter(matches: number[], current: number): string {
	const pos = matches.indexOf(current);
	return `${pos === -1 ? '–' : pos + 1}/${matches.length}`;
}
