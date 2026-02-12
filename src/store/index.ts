import { create } from 'zustand';
import { createNavigationSlice, type NavigationSlice } from './navigation.js';
import { createPlayerSlice, type PlayerSlice } from './player.js';
import { createCacheSlice, type CacheSlice } from './cache.js';

export type AppStore = NavigationSlice & PlayerSlice & CacheSlice;

export const useStore = create<AppStore>()((...args) => ({
	...createNavigationSlice(...args),
	...createPlayerSlice(...args),
	...createCacheSlice(...args),
}));
