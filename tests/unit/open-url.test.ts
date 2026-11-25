import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('node:child_process', () => ({
	spawn: vi.fn(() => ({ on: vi.fn(), unref: vi.fn() })),
}));

import { spawn } from 'node:child_process';
import { toWebUrl } from '../../src/utils/web-url.js';
import { openUrl, openCommand } from '../../src/utils/open-url.js';

const mockSpawn = vi.mocked(spawn);

describe('toWebUrl', () => {
	it('accepts http and https links and returns the normalised href', () => {
		expect(toWebUrl('https://codeklets.nl')).toBe('https://codeklets.nl/');
		expect(toWebUrl('http://example.com/a b')).toBe('http://example.com/a%20b');
		expect(toWebUrl('  HTTPS://Example.com/x  ')).toBe('https://example.com/x');
	});

	it('returns null for other schemes, relative paths and non-strings', () => {
		for (const value of [
			'ftp://example.com/x',
			'mailto:a@example.com',
			'file:///tmp/x.txt',
			'example.com',
			'/relatief/pad',
			'-optie',
			'',
			'   ',
			null,
			undefined,
			42,
		]) {
			expect(toWebUrl(value)).toBeNull();
		}
	});
});

describe('openCommand', () => {
	const href = 'https://example.com/';

	it('uses open on macOS', () => {
		expect(openCommand('darwin', href)).toEqual({ cmd: 'open', args: [href] });
	});

	it('uses rundll32 with the URL handler on Windows', () => {
		expect(openCommand('win32', href)).toEqual({
			cmd: 'rundll32',
			args: ['url.dll,FileProtocolHandler', href],
		});
	});

	it('uses xdg-open elsewhere', () => {
		expect(openCommand('linux', href)).toEqual({
			cmd: 'xdg-open',
			args: [href],
		});
	});
});

describe('openUrl', () => {
	beforeEach(() => {
		mockSpawn.mockClear();
	});

	it('opens a web link with the normalised href and returns true', () => {
		expect(openUrl('https://Example.com/pad')).toBe(true);
		expect(mockSpawn).toHaveBeenCalledTimes(1);
		const args = mockSpawn.mock.calls[0]![1] as string[];
		expect(args[args.length - 1]).toBe('https://example.com/pad');
	});

	it('does not open other links and returns false', () => {
		expect(openUrl('ftp://example.com/x')).toBe(false);
		expect(openUrl('mailto:a@example.com')).toBe(false);
		expect(openUrl('geen link')).toBe(false);
		expect(mockSpawn).not.toHaveBeenCalled();
	});
});
