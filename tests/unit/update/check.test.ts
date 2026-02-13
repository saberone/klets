import { describe, it, expect } from 'vitest';
import { isNewerVersion } from '../../../src/update/check.js';

describe('isNewerVersion', () => {
	it('returns true when major is higher', () => {
		expect(isNewerVersion('1.0.0', '2.0.0')).toBe(true);
	});

	it('returns true when minor is higher', () => {
		expect(isNewerVersion('1.0.0', '1.1.0')).toBe(true);
	});

	it('returns true when patch is higher', () => {
		expect(isNewerVersion('1.0.0', '1.0.1')).toBe(true);
	});

	it('returns false when versions are equal', () => {
		expect(isNewerVersion('1.2.3', '1.2.3')).toBe(false);
	});

	it('returns false when current is newer (major)', () => {
		expect(isNewerVersion('2.0.0', '1.0.0')).toBe(false);
	});

	it('returns false when current is newer (minor)', () => {
		expect(isNewerVersion('1.2.0', '1.1.0')).toBe(false);
	});

	it('returns false when current is newer (patch)', () => {
		expect(isNewerVersion('1.0.5', '1.0.3')).toBe(false);
	});

	it('handles multi-digit version numbers', () => {
		expect(isNewerVersion('1.9.0', '1.10.0')).toBe(true);
		expect(isNewerVersion('1.10.0', '1.9.0')).toBe(false);
	});
});
