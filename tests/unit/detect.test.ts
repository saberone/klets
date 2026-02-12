import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { detectBackend } from '../../src/player/detect.js';

vi.mock('node:child_process', () => ({
	execSync: vi.fn(),
}));

const mockExecSync = vi.mocked(execSync);

describe('detectBackend', () => {
	beforeEach(() => {
		mockExecSync.mockReset();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns mpv when available', () => {
		mockExecSync.mockImplementation((cmd) => {
			if (typeof cmd === 'string' && cmd.includes('mpv')) return Buffer.from('');
			throw new Error('not found');
		});
		expect(detectBackend()).toBe('mpv');
	});

	it('falls back to ffplay when mpv is missing', () => {
		mockExecSync.mockImplementation((cmd) => {
			if (typeof cmd === 'string' && cmd.includes('ffplay')) return Buffer.from('');
			throw new Error('not found');
		});
		expect(detectBackend()).toBe('ffplay');
	});

	it('returns null when nothing is found', () => {
		mockExecSync.mockImplementation(() => {
			throw new Error('not found');
		});
		// afplay check also depends on platform — on non-darwin, all fail
		const originalPlatform = Object.getOwnPropertyDescriptor(
			process,
			'platform',
		);
		Object.defineProperty(process, 'platform', { value: 'linux' });
		expect(detectBackend()).toBeNull();
		if (originalPlatform) {
			Object.defineProperty(process, 'platform', originalPlatform);
		}
	});
});
