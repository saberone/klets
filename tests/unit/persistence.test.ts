import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, statSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const home = mkdtempSync(join(tmpdir(), 'klets-home-'));

vi.mock('node:os', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:os')>();
	return { ...actual, homedir: () => home };
});

import { saveJson, loadJson, getConfigDir } from '../../src/utils/persistence.js';

const posix = process.platform !== 'win32';
const mode = (p: string) => statSync(p).mode & 0o777;

describe('persistence', () => {
	beforeEach(() => {
		rmSync(join(home, '.config'), { recursive: true, force: true });
	});

	afterAll(() => {
		rmSync(home, { recursive: true, force: true });
	});

	it('creates the config directory and files for the owner only', async () => {
		await saveJson('history.json', [{ slug: 'ep-1' }]);
		const dir = getConfigDir();
		expect(dir).toBe(join(home, '.config', 'klets'));
		expect(JSON.parse(readFileSync(join(dir, 'history.json'), 'utf-8'))).toEqual([
			{ slug: 'ep-1' },
		]);
		if (posix) {
			expect(mode(dir)).toBe(0o700);
			expect(mode(join(dir, 'history.json'))).toBe(0o600);
		}
		expect(await loadJson('history.json')).toEqual([{ slug: 'ep-1' }]);
	});

	it.skipIf(!posix)('tightens an existing directory and file when writing', async () => {
		const dir = getConfigDir();
		mkdirSync(dir, { recursive: true, mode: 0o755 });
		writeFileSync(join(dir, 'favorites.json'), '[]', { mode: 0o644 });
		expect(mode(dir)).toBe(0o755);

		await saveJson('favorites.json', []);
		expect(mode(dir)).toBe(0o700);
		expect(mode(join(dir, 'favorites.json'))).toBe(0o600);
	});
});
