import { describe, it, expect } from 'vitest';
import { mpvArgs } from '../../../src/player/mpv-ipc.js';
import { binaryPathFromPackageJson } from '../../../src/player/backends/klets-audio.js';

describe('mpvArgs', () => {
	it('ends the options with -- right before the URL', () => {
		const args = mpvArgs('https://media.example/ep.mp3', '/tmp/klets-x/mpv.sock');
		expect(args.slice(-2)).toEqual(['--', 'https://media.example/ep.mp3']);
		expect(args).toContain('--input-ipc-server=/tmp/klets-x/mpv.sock');
		expect(args.some((a) => a.startsWith('--start='))).toBe(false);
	});

	it('adds the start position before the --', () => {
		const args = mpvArgs('https://media.example/ep.mp3', '/s.sock', 90.7);
		expect(args.indexOf('--start=90')).toBeLessThan(args.indexOf('--'));
	});
});

describe('binaryPathFromPackageJson', () => {
	it('handles a POSIX path', () => {
		expect(
			binaryPathFromPackageJson(
				'/usr/lib/node_modules/@klets/audio-linux-x64-gnu/package.json',
				'linux',
			),
		).toBe('/usr/lib/node_modules/@klets/audio-linux-x64-gnu/bin/klets-audio');
	});

	it('handles a Windows path', () => {
		expect(
			binaryPathFromPackageJson(
				'C:\\Users\\me\\AppData\\Roaming\\npm\\node_modules\\@klets\\audio-win32-x64\\package.json',
				'win32',
			),
		).toBe(
			'C:\\Users\\me\\AppData\\Roaming\\npm\\node_modules\\@klets\\audio-win32-x64\\bin\\klets-audio.exe',
		);
	});
});
