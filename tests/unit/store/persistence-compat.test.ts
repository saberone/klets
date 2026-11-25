import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/utils/persistence.js', () => ({
	loadJson: vi.fn(),
	saveJson: vi.fn().mockResolvedValue(undefined),
	ensureConfigDir: vi.fn(),
}));

import { loadJson } from '../../../src/utils/persistence.js';
import { useStore } from '../../../src/store/index.js';
import { normalizeFavorites } from '../../../src/store/favorites.js';
import {
	normalizeHistory,
	getResumePosition,
	isUnfinished,
	sortHistory,
	type HistoryEntry,
} from '../../../src/store/history.js';
import { resetStore } from '../../helpers/test-utils.js';

const mockLoadJson = vi.mocked(loadJson);

// Shapes as written by klets 0.6.x
const LEGACY_FAVORITES = [
	{
		slug: 'ep-1',
		title: 'Oude favoriet',
		seasonNumber: 1,
		episodeNumber: 2,
		addedAt: '2025-01-01T00:00:00.000Z',
	},
	{ slug: 'ep-2', title: 'Zonder nummers' },
	{ title: 'kapot, geen slug' },
	null,
	'string-entry',
];

const LEGACY_HISTORY = [
	{
		slug: 'ep-1',
		title: 'Oude aflevering',
		position: 120,
		duration: 3600,
		lastPlayed: '2025-01-01T00:00:00.000Z',
		completed: false,
	},
	{ slug: 'ep-2', title: 'Half', position: 'x', duration: null },
	{ position: 10 },
];

describe('normalizeFavorites', () => {
	it('keeps valid legacy entries and drops invalid ones', () => {
		const result = normalizeFavorites(LEGACY_FAVORITES);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual(LEGACY_FAVORITES[0]);
		expect(result[1]).toEqual({
			slug: 'ep-2',
			title: 'Zonder nummers',
			seasonNumber: null,
			episodeNumber: null,
			addedAt: '',
		});
	});

	it('keeps a valid episodeType and ignores unknown ones', () => {
		const result = normalizeFavorites([
			{ slug: 'a', title: 'A', episodeType: 'bonus' },
			{ slug: 'b', title: 'B', episodeType: 'weird' },
		]);
		expect(result[0]!.episodeType).toBe('bonus');
		expect(result[1]!.episodeType).toBeUndefined();
	});

	it('returns [] for non-array data', () => {
		expect(normalizeFavorites({ slug: 'x' })).toEqual([]);
		expect(normalizeFavorites(null)).toEqual([]);
	});
});

describe('normalizeHistory', () => {
	it('keeps valid legacy entries and defaults broken fields', () => {
		const result = normalizeHistory(LEGACY_HISTORY);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual(LEGACY_HISTORY[0]);
		expect(result[1]).toEqual({
			slug: 'ep-2',
			title: 'Half',
			position: 0,
			duration: 0,
			lastPlayed: '',
			completed: false,
		});
	});
});

describe('loading persisted files from older versions', () => {
	beforeEach(() => {
		resetStore();
		mockLoadJson.mockReset();
	});

	it('loadFavorites loads a 0.6 favorites.json', async () => {
		mockLoadJson.mockResolvedValue(LEGACY_FAVORITES);
		await useStore.getState().loadFavorites();
		const { favorites, favoritesLoaded } = useStore.getState();
		expect(favoritesLoaded).toBe(true);
		expect(favorites.map((f) => f.slug)).toEqual(['ep-1', 'ep-2']);
	});

	it('loadHistory loads a 0.6 history.json', async () => {
		mockLoadJson.mockResolvedValue(LEGACY_HISTORY);
		await useStore.getState().loadHistory();
		const { history, historyLoaded } = useStore.getState();
		expect(historyLoaded).toBe(true);
		expect(history.map((h) => h.slug)).toEqual(['ep-1', 'ep-2']);
	});

	it('a corrupt file (non-array) results in an empty list', async () => {
		mockLoadJson.mockResolvedValue({ hello: 'world' });
		await useStore.getState().loadHistory();
		expect(useStore.getState().history).toEqual([]);
		expect(useStore.getState().historyLoaded).toBe(true);
	});
});

describe('resume rules', () => {
	const entry = (over: Partial<HistoryEntry>): HistoryEntry => ({
		slug: 's',
		title: 't',
		position: 300,
		duration: 3600,
		lastPlayed: '2026-01-01T00:00:00.000Z',
		completed: false,
		...over,
	});

	it('resumes an unfinished episode at its position', () => {
		expect(getResumePosition(entry({}))).toBe(300);
		expect(isUnfinished(entry({}))).toBe(true);
	});

	it('starts from 0 when completed, barely started or near the end', () => {
		expect(getResumePosition(entry({ completed: true }))).toBe(0);
		expect(getResumePosition(entry({ position: 5 }))).toBe(0);
		expect(getResumePosition(entry({ position: 3570 }))).toBe(0);
		expect(getResumePosition(undefined)).toBe(0);
	});

	it('an unknown duration (0) does not block resuming', () => {
		expect(getResumePosition(entry({ duration: 0 }))).toBe(300);
	});

	it('sortHistory orders by lastPlayed descending without mutating', () => {
		const list = [
			entry({ slug: 'old', lastPlayed: '2026-01-01T00:00:00.000Z' }),
			entry({ slug: 'new', lastPlayed: '2026-03-01T00:00:00.000Z' }),
			entry({ slug: 'broken', lastPlayed: '' }),
		];
		expect(sortHistory(list).map((e) => e.slug)).toEqual([
			'new',
			'old',
			'broken',
		]);
		expect(list[0]!.slug).toBe('old');
	});
});

describe('removeHistoryEntry', () => {
	beforeEach(() => resetStore());
	it('removes only the given slug', () => {
		useStore.setState({
			history: normalizeHistory([
				{ slug: 'a', title: 'A' },
				{ slug: 'b', title: 'B' },
			]),
		});
		useStore.getState().removeHistoryEntry('a');
		expect(useStore.getState().history.map((h) => h.slug)).toEqual(['b']);
	});
});

describe('persisted text is cleaned on load', () => {
	const ESC = '\u001b';

	it('removes control characters from history strings', () => {
		const [entry] = normalizeHistory([
			{
				slug: `ep-1${ESC}`,
				title: `Titel${ESC}]52;c;aGFsbG8=\u0007`,
				position: 5,
				duration: 10,
				lastPlayed: '2025-01-01T00:00:00.000Z\u009b',
				completed: false,
			},
		]);
		expect(entry).toMatchObject({
			slug: 'ep-1',
			title: 'Titel]52;c;aGFsbG8=',
			lastPlayed: '2025-01-01T00:00:00.000Z',
		});
	});

	it('removes control characters from favorites strings', () => {
		const [entry] = normalizeFavorites([
			{ slug: 'ep-2\u0007', title: `Fav${ESC}[2J`, addedAt: `x${ESC}` },
		]);
		expect(entry).toMatchObject({ slug: 'ep-2', title: 'Fav[2J', addedAt: 'x' });
	});

	it('drops entries whose slug is empty after cleaning', () => {
		expect(normalizeHistory([{ slug: ESC }])).toEqual([]);
		expect(normalizeFavorites([{ slug: '\u0007' }])).toEqual([]);
	});
});
