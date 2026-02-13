import { describe, it, expect } from 'vitest';
import {
	matchKonamiKey,
	KONAMI_SEQUENCE,
	type KonamiKey,
} from '../../src/hooks/use-konami-code.js';

function runSequence(keys: KonamiKey[]): { position: number; complete: boolean } {
	let position = 0;
	let result = { position: 0, complete: false };
	for (const key of keys) {
		result = matchKonamiKey(key, position);
		position = result.position;
	}
	return result;
}

describe('matchKonamiKey', () => {
	it('advances position on correct key', () => {
		const result = matchKonamiKey('up', 0);
		expect(result).toEqual({ position: 1, complete: false });
	});

	it('resets position on wrong key', () => {
		const result = matchKonamiKey('down', 0);
		expect(result).toEqual({ position: 0, complete: false });
	});

	it('restarts from 1 if wrong key matches sequence start', () => {
		// At position 2 (expecting 'down'), pressing 'up' (which is SEQUENCE[0])
		const result = matchKonamiKey('up', 2);
		expect(result).toEqual({ position: 1, complete: false });
	});

	it('completes on full correct sequence', () => {
		const result = runSequence(KONAMI_SEQUENCE as unknown as KonamiKey[]);
		expect(result.complete).toBe(true);
		expect(result.position).toBe(0); // resets after completion
	});

	it('does not complete on partial sequence', () => {
		const partial = KONAMI_SEQUENCE.slice(0, 5) as KonamiKey[];
		const result = runSequence(partial);
		expect(result.complete).toBe(false);
		expect(result.position).toBe(5);
	});

	it('recovers after wrong key and completes', () => {
		const keys: KonamiKey[] = [
			'up',
			'up',
			'right', // wrong — resets to 0
			...KONAMI_SEQUENCE as unknown as KonamiKey[],
		];
		const result = runSequence(keys);
		expect(result.complete).toBe(true);
	});

	it('handles sequence that starts over with matching first key', () => {
		const keys: KonamiKey[] = [
			'up', // pos 0 → 1
			'up', // pos 1 → 2
			'up', // wrong for pos 2 (expects 'down'), but matches start → pos 1
			'up', // pos 1 → 2
			'down', // pos 2 → 3
			'down', // pos 3 → 4
			'left', // pos 4 → 5
			'right', // pos 5 → 6
			'left', // pos 6 → 7
			'right', // pos 7 → 8
			'b', // pos 8 → 9
			'a', // pos 9 → complete
		];
		const result = runSequence(keys);
		expect(result.complete).toBe(true);
	});
});
