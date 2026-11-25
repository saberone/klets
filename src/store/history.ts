import type { StateCreator } from 'zustand';
import { loadJson, saveJson } from '../utils/persistence.js';

export const HISTORY_FILE = 'history.json';

export interface HistoryEntry {
	slug: string;
	title: string;
	position: number;
	/** 0 when the duration is unknown */
	duration: number;
	lastPlayed: string;
	completed: boolean;
}

/** Minimum position (seconds) before an episode counts as "started". */
export const RESUME_MIN_POSITION = 10;
/** Within this many seconds of the end we start from the beginning instead. */
export const RESUME_END_MARGIN = 60;

/** An entry is unfinished when it is not completed and past the first 10 seconds. */
export function isUnfinished(entry: HistoryEntry | undefined | null): boolean {
	return (
		!!entry && !entry.completed && entry.position > RESUME_MIN_POSITION
	);
}

/**
 * Position (seconds) to resume an episode at, or 0 to start from the beginning.
 * An unknown duration (0) does not block resuming.
 */
export function getResumePosition(
	entry: HistoryEntry | undefined | null,
): number {
	if (!entry || !isUnfinished(entry)) return 0;
	if (entry.duration > 0 && entry.position >= entry.duration - RESUME_END_MARGIN) {
		return 0;
	}
	return entry.position;
}

/** History sorted by lastPlayed, most recent first (does not mutate). */
export function sortHistory(history: HistoryEntry[]): HistoryEntry[] {
	const time = (h: HistoryEntry) => {
		const t = Date.parse(h.lastPlayed);
		return Number.isNaN(t) ? 0 : t;
	};
	return [...history].sort((a, b) => time(b) - time(a));
}

function toNumber(value: unknown): number {
	return typeof value === 'number' && Number.isFinite(value) && value > 0
		? value
		: 0;
}

/**
 * Normalizes persisted history (including files written by older versions).
 * Invalid entries are dropped, missing fields get safe defaults.
 */
export function normalizeHistory(data: unknown): HistoryEntry[] {
	if (!Array.isArray(data)) return [];
	const result: HistoryEntry[] = [];
	for (const raw of data) {
		if (!raw || typeof raw !== 'object') continue;
		const r = raw as Record<string, unknown>;
		if (typeof r['slug'] !== 'string' || r['slug'] === '') continue;
		result.push({
			slug: r['slug'],
			title: typeof r['title'] === 'string' ? r['title'] : r['slug'],
			position: toNumber(r['position']),
			duration: toNumber(r['duration']),
			lastPlayed: typeof r['lastPlayed'] === 'string' ? r['lastPlayed'] : '',
			completed: r['completed'] === true,
		});
	}
	return result;
}

/** Loads history from disk without the store (used by the `play` command). */
export async function readHistoryFile(): Promise<HistoryEntry[]> {
	return normalizeHistory(await loadJson<unknown>(HISTORY_FILE));
}

export interface HistorySlice {
	history: HistoryEntry[];
	historyLoaded: boolean;
	loadHistory: () => Promise<void>;
	updateHistory: (
		slug: string,
		title: string,
		position: number,
		duration: number,
	) => void;
	getHistoryEntry: (slug: string) => HistoryEntry | undefined;
	markCompleted: (slug: string) => void;
	removeHistoryEntry: (slug: string) => void;
}

export const createHistorySlice: StateCreator<HistorySlice> = (set, get) => ({
	history: [],
	historyLoaded: false,

	loadHistory: async () => {
		const data = await loadJson<unknown>(HISTORY_FILE);
		if (data) {
			set({ history: normalizeHistory(data), historyLoaded: true });
		} else {
			set({ historyLoaded: true });
		}
	},

	updateHistory: (slug, title, position, duration) => {
		set((state) => {
			const existing = state.history.find((h) => h.slug === slug);
			const entry: HistoryEntry = {
				slug,
				title,
				position,
				duration: duration > 0 ? duration : (existing?.duration ?? 0),
				lastPlayed: new Date().toISOString(),
				completed: existing?.completed ?? false,
			};

			const newHistory = existing
				? state.history.map((h) => (h.slug === slug ? entry : h))
				: [entry, ...state.history];

			// Persist asynchronously — fire and forget
			saveJson(HISTORY_FILE, newHistory);

			return { history: newHistory };
		});
	},

	getHistoryEntry: (slug) => {
		return get().history.find((h) => h.slug === slug);
	},

	markCompleted: (slug) => {
		set((state) => {
			const newHistory = state.history.map((h) =>
				h.slug === slug ? { ...h, completed: true } : h,
			);
			saveJson(HISTORY_FILE, newHistory);
			return { history: newHistory };
		});
	},

	removeHistoryEntry: (slug) => {
		set((state) => {
			const newHistory = state.history.filter((h) => h.slug !== slug);
			saveJson(HISTORY_FILE, newHistory);
			return { history: newHistory };
		});
	},
});
