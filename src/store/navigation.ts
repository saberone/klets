import type { StateCreator } from 'zustand';

export type ScreenName =
	| 'home'
	| 'episodes-list'
	| 'episode-detail'
	| 'transcript'
	| 'topics-list'
	| 'topic-detail'
	| 'persons-list'
	| 'person-detail'
	| 'search';

export interface ScreenEntry {
	screen: ScreenName;
	params?: Record<string, unknown>;
}

export interface NavigationSlice {
	stack: ScreenEntry[];
	currentScreen: () => ScreenEntry;
	navigate: (screen: ScreenName, params?: Record<string, unknown>) => void;
	goBack: () => void;
	resetTo: (screen: ScreenName, params?: Record<string, unknown>) => void;
}

export const createNavigationSlice: StateCreator<NavigationSlice> = (
	set,
	get,
) => ({
	stack: [{ screen: 'home' }],

	currentScreen: () => {
		const { stack } = get();
		return stack[stack.length - 1]!;
	},

	navigate: (screen, params) =>
		set((state) => ({
			stack: [...state.stack, { screen, params }],
		})),

	goBack: () =>
		set((state) => ({
			stack: state.stack.length > 1 ? state.stack.slice(0, -1) : state.stack,
		})),

	resetTo: (screen, params) =>
		set(() => ({
			stack: [{ screen, params }],
		})),
});
