import { describe, it, expect, vi, afterEach } from 'vitest';
import { dirname } from 'node:path';
import { readFileSync } from 'node:fs';

vi.mock('node:child_process', () => ({
	spawn: vi.fn(() => ({ on: vi.fn(), unref: vi.fn() })),
}));
vi.mock('../../../src/player/detect.js', () => ({
	commandExists: (cmd: string) => cmd === 'mpv',
}));

import { spawn } from 'node:child_process';
import { playJingle } from '../../../src/audio/jingle.js';
import {
	getPrivateTempDir,
	removePrivateTempDir,
} from '../../../src/utils/temp-dir.js';

describe('playJingle', () => {
	afterEach(() => {
		removePrivateTempDir();
	});

	it('writes the wav into the private temp directory and plays that local file', async () => {
		await playJingle();
		expect(spawn).toHaveBeenCalledTimes(1);
		const [cmd, args] = vi.mocked(spawn).mock.calls[0]!;
		expect(cmd).toBe('mpv');
		const wavPath = (args as string[])[(args as string[]).length - 1]!;
		expect(dirname(wavPath)).toBe(getPrivateTempDir());
		expect(readFileSync(wavPath).toString('ascii', 0, 4)).toBe('RIFF');
	});
});
