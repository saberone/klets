import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { detectBackend } from '../../src/player/detect.js';

vi.mock('node:child_process', () => ({
	execSync: vi.fn(),
}));

vi.mock('../../src/player/backends/klets-audio.js', () => ({
	isAvailable: vi.fn(() => false),
}));

const mockExecSync = vi.mocked(execSync);
const { isAvailable: mockIsAvailable } = await import(
	'../../src/player/backends/klets-audio.js'
);

describe('detectBackend', () => {
	beforeEach(() => {
		mockExecSync.mockReset();
		vi.mocked(mockIsAvailable).mockReturnValue(false);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns klets-audio when available', () => {
		vi.mocked(mockIsAvailable).mockReturnValue(true);
		expect(detectBackend()).toBe('klets-audio');
	});

	it('returns mpv when available and klets-audio is not', () => {
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
