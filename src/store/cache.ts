import type { StateCreator } from 'zustand';

interface CacheEntry {
	data: unknown;
	expiresAt: number;
}

export interface CacheSlice {
	_cache: Map<string, CacheEntry>;
	getCached: <T>(key: string) => T | null;
	setCache: (key: string, data: unknown, ttlMs: number) => void;
	clearCache: () => void;
}

export const createCacheSlice: StateCreator<CacheSlice> = (set, get) => ({
	_cache: new Map(),

	getCached: <T>(key: string): T | null => {
		const entry = get()._cache.get(key);
		if (!entry) return null;
		if (Date.now() > entry.expiresAt) {
			get()._cache.delete(key);
			return null;
		}
		return entry.data as T;
	},

	setCache: (key, data, ttlMs) =>
		set((state) => {
			const newCache = new Map(state._cache);
			newCache.set(key, { data, expiresAt: Date.now() + ttlMs });
			return { _cache: newCache };
		}),

	clearCache: () => set({ _cache: new Map() }),
});
