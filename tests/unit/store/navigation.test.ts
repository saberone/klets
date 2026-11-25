import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../../../src/store/index.js';
import { resetStore } from '../../helpers/test-utils.js';

describe('navigation store', () => {
	beforeEach(() => {
		resetStore();
	});

	it('has initial state with home screen', () => {
		const { stack } = useStore.getState();
		expect(stack).toEqual([{ screen: 'home' }]);
	});

	it('navigates to a new screen', () => {
		useStore.getState().navigate('episodes-list');
		const { stack } = useStore.getState();
		expect(stack).toHaveLength(2);
		expect(stack[1]).toEqual({ screen: 'episodes-list', params: undefined });
	});

	it('navigates with params', () => {
		useStore.getState().navigate('episode-detail', { slug: 'test-ep' });
		const { stack } = useStore.getState();
		expect(stack[1]).toEqual({
			screen: 'episode-detail',
			params: { slug: 'test-ep' },
		});
	});

	it('goes back', () => {
		useStore.getState().navigate('episodes-list');
		useStore.getState().goBack();
		const { stack } = useStore.getState();
		expect(stack).toHaveLength(1);
		expect(stack[0]!.screen).toBe('home');
	});

	it('does not go back past root', () => {
		useStore.getState().goBack();
		const { stack } = useStore.getState();
		expect(stack).toHaveLength(1);
		expect(stack[0]!.screen).toBe('home');
	});

	it('resets to a screen', () => {
		useStore.getState().navigate('episodes-list');
		useStore.getState().navigate('episode-detail');
		useStore.getState().resetTo('search');
		const { stack } = useStore.getState();
		expect(stack).toHaveLength(1);
		expect(stack[0]).toEqual({ screen: 'search', params: undefined });
	});

	it('currentScreen returns top of stack', () => {
		useStore.getState().navigate('topics-list');
		const current = useStore.getState().currentScreen();
		expect(current.screen).toBe('topics-list');
	});

	it('setCurrentParams merges into the top entry and removes undefined keys', () => {
		useStore.getState().navigate('episode-detail', { slug: 'a' });
		useStore.getState().setCurrentParams({ playError: 'x' });
		expect(useStore.getState().stack[1]!.params).toEqual({ slug: 'a', playError: 'x' });
		useStore.getState().setCurrentParams({ playError: undefined });
		expect(useStore.getState().stack[1]!.params).toEqual({ slug: 'a' });
		expect(useStore.getState().stack[0]).toEqual({ screen: 'home' });
	});
});
