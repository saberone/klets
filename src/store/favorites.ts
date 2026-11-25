import type { StateCreator } from 'zustand';
import { loadJson, saveJson } from '../utils/persistence.js';
import type { EpisodeType } from '../api/types.js';
import { cleanText } from '../utils/clean-text.js';

const FAVORITES_FILE = 'favorites.json';

export interface FavoriteEntry {
	slug: string;
	title: string;
	seasonNumber: number | null;
	episodeNumber: number | null;
	/** Missing in favorites saved by klets < 0.7 */
	episodeType?: EpisodeType;
	addedAt: string;
}

function toNullableNumber(value: unknown): number | null {
	return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Normalizes persisted favorites (including files written by older versions).
 * Invalid entries are dropped, missing fields get safe defaults.
 */
export function normalizeFavorites(data: unknown): FavoriteEntry[] {
	if (!Array.isArray(data)) return [];
	const result: FavoriteEntry[] = [];
	for (const raw of data) {
		if (!raw || typeof raw !== 'object') continue;
		const r = raw as Record<string, unknown>;
		if (typeof r['slug'] !== 'string') continue;
		const slug = cleanText(r['slug']);
		if (slug === '') continue;
		const type = r['episodeType'];
		result.push({
			slug,
			title: typeof r['title'] === 'string' ? cleanText(r['title']) : slug,
			seasonNumber: toNullableNumber(r['seasonNumber']),
			episodeNumber: toNullableNumber(r['episodeNumber']),
			...(type === 'full' || type === 'trailer' || type === 'bonus'
				? { episodeType: type }
				: {}),
			addedAt: typeof r['addedAt'] === 'string' ? cleanText(r['addedAt']) : '',
		});
	}
	return result;
}

export interface FavoritesSlice {
	favorites: FavoriteEntry[];
	favoritesLoaded: boolean;
	loadFavorites: () => Promise<void>;
	toggleFavorite: (
		slug: string,
		title: string,
		seasonNumber: number | null,
		episodeNumber: number | null,
		episodeType?: EpisodeType,
	) => void;
	isFavorite: (slug: string) => boolean;
}

export const createFavoritesSlice: StateCreator<FavoritesSlice> = (
	set,
	get,
) => ({
	favorites: [],
	favoritesLoaded: false,

	loadFavorites: async () => {
		const data = await loadJson<unknown>(FAVORITES_FILE);
		if (data) {
			set({ favorites: normalizeFavorites(data), favoritesLoaded: true });
		} else {
			set({ favoritesLoaded: true });
		}
	},

	toggleFavorite: (slug, title, seasonNumber, episodeNumber, episodeType) => {
		set((state) => {
			const exists = state.favorites.some((f) => f.slug === slug);
			const newFavorites = exists
				? state.favorites.filter((f) => f.slug !== slug)
				: [
						{
							slug,
							title,
							seasonNumber,
							episodeNumber,
							...(episodeType ? { episodeType } : {}),
							addedAt: new Date().toISOString(),
						},
						...state.favorites,
					];

			saveJson(FAVORITES_FILE, newFavorites);
			return { favorites: newFavorites };
		});
	},

	isFavorite: (slug) => {
		return get().favorites.some((f) => f.slug === slug);
	},
});
