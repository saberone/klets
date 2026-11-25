import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../src/player/detect.js', () => ({
	detectBackendAsync: vi.fn().mockResolvedValue('mpv'),
}));
vi.mock('../../../src/player/mpv-ipc.js', () => ({
	startMpv: vi.fn().mockReturnValue(true),
	stopMpv: vi.fn(),
	isMpvActive: vi.fn().mockReturnValue(false),
	seekMpv: vi.fn(),
	seekAbsoluteMpv: vi.fn(),
	getPositionMpv: vi.fn().mockReturnValue(0),
	getDurationMpv: vi.fn().mockReturnValue(0),
	setSpeedMpv: vi.fn(),
}));
vi.mock('../../../src/player/backends/klets-audio.js', () => ({}));
vi.mock('../../../src/player/backends/pcm-pipe.js', () => ({}));
vi.mock('../../../src/player/backends/command.js', () => ({}));

import { play } from '../../../src/player/index.js';
import { startMpv, stopMpv } from '../../../src/player/mpv-ipc.js';
import { detectBackendAsync } from '../../../src/player/detect.js';

describe('play', () => {
	beforeEach(() => {
		vi.mocked(startMpv).mockClear();
		vi.mocked(stopMpv).mockClear();
	});

	it('passes the normalised web link to the backend', async () => {
		expect(await play('https://Media.example/ep 1.mp3', 30)).toBe(true);
		expect(startMpv).toHaveBeenCalledWith('https://media.example/ep%201.mp3', 30);
	});

	it('does not start (or stop current playback) for links that are not web addresses', async () => {
		vi.mocked(detectBackendAsync).mockClear();
		for (const url of ['ftp://media.example/ep.mp3', '--optie', '/tmp/ep.mp3', '']) {
			expect(await play(url)).toBe(false);
		}
		expect(startMpv).not.toHaveBeenCalled();
		expect(stopMpv).not.toHaveBeenCalled();
	});
});
