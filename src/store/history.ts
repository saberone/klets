import type { StateCreator } from 'zustand';
import { loadJson, saveJson } from '../utils/persistence.js';

const HISTORY_FILE = 'history.json';

export interface HistoryEntry {
	slug: string;
	title: string;
	position: number;
	duration: number;
	lastPlayed: string;
	completed: boolean;
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
}

export const createHistorySlice: StateCreator<HistorySlice> = (set, get) => ({
	history: [],
	historyLoaded: false,

	loadHistory: async () => {
		const data = await loadJson<HistoryEntry[]>(HISTORY_FILE);
		if (data) {
			set({ history: data, historyLoaded: true });
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
				duration,
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
});
