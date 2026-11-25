import { describe, it, expect, afterEach } from 'vitest';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { tmpdir } from 'node:os';
import {
	getPrivateTempDir,
	privateTempPath,
	removePrivateTempDir,
} from '../../src/utils/temp-dir.js';

describe('private temp directory', () => {
	afterEach(() => {
		removePrivateTempDir();
	});

	it('creates one owner-only directory per process under the system temp dir', () => {
		const dir = getPrivateTempDir();
		expect(getPrivateTempDir()).toBe(dir);
		expect(dirname(dir)).toBe(tmpdir());
		expect(existsSync(dir)).toBe(true);
		if (process.platform !== 'win32') {
			expect(statSync(dir).mode & 0o777).toBe(0o700);
		}
	});

	it('places files inside it and removes everything on cleanup', () => {
		const file = privateTempPath('jingle.wav');
		expect(dirname(file)).toBe(getPrivateTempDir());
		writeFileSync(file, 'x');
		const dir = getPrivateTempDir();
		removePrivateTempDir();
		expect(existsSync(dir)).toBe(false);
		// A new call creates a fresh directory
		expect(getPrivateTempDir()).not.toBe(dir);
	});
});
