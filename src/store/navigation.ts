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
	| 'search'
	| 'help'
	| 'favorites'
	| 'history'
	| 'moments';

/**
 * Which global keybindings a focused text input is currently taking over:
 * - 'none': all global keys work
 * - 'escape': only esc is handled by the screen (e.g. to clear an active search)
 * - 'all': no global key fires (typing "q" types a q)
 */
export type InputCapture = 'none' | 'escape' | 'all';

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
	/** Merges params into the top screen entry (undefined removes a key). */
	setCurrentParams: (params: Record<string, unknown>) => void;
	inputCapture: InputCapture;
	setInputCapture: (capture: InputCapture) => void;
}

export const createNavigationSlice: StateCreator<NavigationSlice> = (
	set,
	get,
) => ({
	stack: [{ screen: 'home' }],
	inputCapture: 'none',

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

	setCurrentParams: (params) =>
		set((state) => {
			const top = state.stack[state.stack.length - 1]!;
			const merged: Record<string, unknown> = { ...top.params, ...params };
			for (const k of Object.keys(merged)) {
				if (merged[k] === undefined) delete merged[k];
			}
			return {
				stack: [...state.stack.slice(0, -1), { ...top, params: merged }],
			};
		}),

	setInputCapture: (capture) => set({ inputCapture: capture }),
});
