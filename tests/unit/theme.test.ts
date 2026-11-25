import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { colors } from '../../src/theme/colors.js';
import {
	PALETTE,
	buildWavePalette,
	mixHex,
} from '../../src/hooks/use-color-wave.js';

function walk(dir: string): string[] {
	return readdirSync(dir).flatMap((name) => {
		const p = join(dir, name);
		return statSync(p).isDirectory() ? walk(p) : [p];
	});
}

describe('brand colours', () => {
	it('uses cyan as primary and coral as secondary', () => {
		expect(colors.cyan).toBe('#00f0ff');
		expect(colors.coral).toBe('#f4a6b8');
		expect('purple' in colors).toBe(false);
	});

	it('the retired purple is not used anywhere in src/', () => {
		const src = resolve(import.meta.dirname, '../../src');
		for (const file of walk(src)) {
			const text = readFileSync(file, 'utf8');
			expect(text, file).not.toMatch(/#bf00ff|colors\.purple/i);
		}
	});
});

describe('banner wave palette', () => {
	it('goes cyan → coral → cyan through intermediate steps', () => {
		expect(PALETTE[0]).toBe(colors.cyan);
		expect(PALETTE).toContain(colors.coral);
		expect(PALETTE).toEqual([
			'#00f0ff',
			'#51d7e7',
			'#a3bfd0',
			'#f4a6b8',
			'#a3bfd0',
			'#51d7e7',
		]);
	});

	it('mixHex blends linearly', () => {
		expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
		expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
		expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
	});

	it('buildWavePalette loops back without repeating the endpoints', () => {
		const p = buildWavePalette('#000000', '#ffffff', 1);
		expect(p).toEqual(['#000000', '#808080', '#ffffff', '#808080']);
	});
});
