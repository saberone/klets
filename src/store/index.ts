import { create } from 'zustand';
import { createNavigationSlice, type NavigationSlice } from './navigation.js';
import { createPlayerSlice, type PlayerSlice } from './player.js';
import { createCacheSlice, type CacheSlice } from './cache.js';
import { createHistorySlice, type HistorySlice } from './history.js';
import { createFavoritesSlice, type FavoritesSlice } from './favorites.js';

export type AppStore = NavigationSlice &
	PlayerSlice &
	CacheSlice &
	HistorySlice &
	FavoritesSlice;

export const useStore = create<AppStore>()((...args) => ({
	...createNavigationSlice(...args),
	...createPlayerSlice(...args),
	...createCacheSlice(...args),
	...createHistorySlice(...args),
	...createFavoritesSlice(...args),
}));
