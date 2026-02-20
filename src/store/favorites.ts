import type { StateCreator } from 'zustand';
import { loadJson, saveJson } from '../utils/persistence.js';

const FAVORITES_FILE = 'favorites.json';

export interface FavoriteEntry {
	slug: string;
	title: string;
	seasonNumber: number;
	episodeNumber: number;
	addedAt: string;
}

export interface FavoritesSlice {
	favorites: FavoriteEntry[];
	favoritesLoaded: boolean;
	loadFavorites: () => Promise<void>;
	toggleFavorite: (
		slug: string,
		title: string,
		seasonNumber: number,
		episodeNumber: number,
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
		const data = await loadJson<FavoriteEntry[]>(FAVORITES_FILE);
		if (data) {
			set({ favorites: data, favoritesLoaded: true });
		} else {
			set({ favoritesLoaded: true });
		}
	},

	toggleFavorite: (slug, title, seasonNumber, episodeNumber) => {
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
