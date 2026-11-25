import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dirname } from 'node:path';

vi.mock('node:child_process', () => ({
	spawn: vi.fn(() => ({ on: vi.fn(), kill: vi.fn(), exitCode: null })),
}));
vi.mock('node:module', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:module')>();
	return {
		...actual,
		createRequire: () => ({
			resolve: () => '/opt/node_modules/@klets/audio-test/package.json',
		}),
	};
});
vi.mock('node:fs', async (importOriginal) => {
	const actual = await importOriginal<typeof import('node:fs')>();
	return { ...actual, chmodSync: vi.fn() };
});

import { spawn } from 'node:child_process';
import { startMpv, stopMpv } from '../../../src/player/mpv-ipc.js';
import * as kletsAudio from '../../../src/player/backends/klets-audio.js';
import { getPrivateTempDir, removePrivateTempDir } from '../../../src/utils/temp-dir.js';

const mockSpawn = vi.mocked(spawn);

describe('player sockets', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockSpawn.mockClear();
	});

	afterEach(() => {
		vi.useRealTimers();
		removePrivateTempDir();
	});

	it('mpv uses a socket inside the private temp directory', () => {
		startMpv('https://media.example/ep.mp3');
		const args = mockSpawn.mock.calls[0]![1] as string[];
		const ipc = args.find((a) => a.startsWith('--input-ipc-server='))!;
		const socket = ipc.slice('--input-ipc-server='.length);
		expect(dirname(socket)).toBe(getPrivateTempDir());
		stopMpv();
	});

	it('klets-audio gets a socket path inside the private temp directory', () => {
		if (!kletsAudio.isAvailable()) {
			// Only on platforms without a klets-audio package
			expect(kletsAudio.play('https://media.example/ep.mp3')).toBe(false);
			return;
		}
		expect(kletsAudio.play('https://media.example/ep.mp3')).toBe(true);
		const [binary, args] = mockSpawn.mock.calls[0]!;
		expect(binary).toMatch(/klets-audio(\.exe)?$/);
		expect((args as string[])[0]).toBe('--socket');
		expect(dirname((args as string[])[1]!)).toBe(getPrivateTempDir());
		kletsAudio.stop();
	});
});
