import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useStore } from '../../../src/store/index.js';
import { resetStore } from '../../helpers/test-utils.js';

describe('cache store', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		resetStore();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns null for missing key', () => {
		expect(useStore.getState().getCached('nonexistent')).toBeNull();
	});

	it('stores and retrieves data', () => {
		useStore.getState().setCache('key1', { hello: 'world' }, 60_000);
		expect(useStore.getState().getCached('key1')).toEqual({
			hello: 'world',
		});
	});

	it('expires after TTL', () => {
		useStore.getState().setCache('key1', 'data', 5000);
		expect(useStore.getState().getCached('key1')).toBe('data');

		vi.advanceTimersByTime(5001);
		expect(useStore.getState().getCached('key1')).toBeNull();
	});

	it('clearCache removes all entries', () => {
		useStore.getState().setCache('a', 1, 60_000);
		useStore.getState().setCache('b', 2, 60_000);
		useStore.getState().clearCache();
		expect(useStore.getState().getCached('a')).toBeNull();
		expect(useStore.getState().getCached('b')).toBeNull();
	});
});
